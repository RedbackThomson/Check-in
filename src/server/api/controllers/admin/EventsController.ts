import Uploads from '@Config/Uploads';
import { AdminDocument } from '@Models/Admin';
import { EventDocument } from '@Models/Event';
import { TeamDocument } from '@Models/Team';
import AdminService from '@Services/AdminService';
import EventService from '@Services/EventService';
import SponsorService from '@Services/SponsorService';
import TeamService from '@Services/TeamService';
import UserService from '@Services/UserService';
import { AddOrganiserRequest, AddSponsorRequest, AddTeamMembersRequest, CheckinUserRequest, RegisterEventRequest, UpdateEventOptionsRequest, UpdateTeamRequest, RemoveTeamMembersRequest } from '@Shared/api/Requests';
import { SuccessResponse } from '@Shared/api/Responses';
import { Admin, MAX_TEAM_SIZE, TESCTeam, TESCUser } from '@Shared/ModelTypes';
import { hasRankAtLeast, hasRankEqual, Role } from '@Shared/Roles';
import { BadRequestError, Body, BodyParam, Get, JsonController, Param, Patch, Post, Put, UploadedFile, UseBefore, ForbiddenError } from 'routing-controllers';
import { ErrorMessage } from '../../../utils/Errors';
import { SelectedEventID } from '../..//decorators/SelectedEventID';
import { SelectedTeamID } from '../..//decorators/SelectedTeamID';
import { ValidateEventID } from '../..//middleware/ValidateEventID';
import { AuthorisedAdmin } from '../../decorators/AuthorisedAdmin';
import { AdminAuthorisation } from '../../middleware/AdminAuthorisation';
import { RoleAuth } from '../../middleware/RoleAuth';

/**
 * Handles all of the logic for fetching and modifying information about particular events
 * and its associated users and admins.
 */
@JsonController('/events')
@UseBefore(AdminAuthorisation)
export class EventsController {
  constructor(
    private AdminService: AdminService,
    private EventService: EventService,
    private SponsorService: SponsorService,
    private TeamService: TeamService,
    private UserService: UserService,
  ) { }

  @Get('/')
  @UseBefore(RoleAuth(Role.ROLE_SPONSOR))
  async getEvents(@AuthorisedAdmin() admin: Admin) {
    let events: EventDocument[];
    if (hasRankEqual(admin, Role.ROLE_SPONSOR)) {
      events = await this.EventService.getEventsBySponsor(admin);
    } else if (hasRankAtLeast(admin, Role.ROLE_DEVELOPER)) {
      events = await this.EventService.getAllPopulatedEvents();
    } else {
      events = await this.EventService.getEventsByOrganiser(admin);
    }

    const eventIDs = events.map(event => event._id.toHexString());
    let userCounts = await this.EventService.getAllUserCounts();
    // Filter UserCounts by events
    userCounts = userCounts.filter(count => eventIDs.includes(count._id));

    return {
      events,
      userCounts,
    };
  }

  @Post('/')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  async createNewEvent(@UploadedFile('logo', { options: Uploads }) logo: Express.Multer.File,
    @BodyParam('event') event: RegisterEventRequest, @AuthorisedAdmin() admin: AdminDocument) {
    let newEvent = await this.EventService.createNewEvent(event, logo.path);

    if (hasRankEqual(admin, Role.ROLE_ADMIN)) {
      newEvent = await this.EventService.addOrganiserToEvent(newEvent, admin);
    }
    return newEvent;
  }

  @Post('/edit/:eventId')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  async editExistingEvent(
    @Param('eventId') id: string,
    @BodyParam('event') event: RegisterEventRequest,
    @UploadedFile('logo', { options: Uploads, required: false }) logo?: Express.Multer.File,
  ) {
    await this.EventService.editExistingEvent(id, event, logo ? logo.path : undefined);
    return SuccessResponse.Positive;
  }

  @Put('/')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  async updateEventOptions(@Body() body: UpdateEventOptionsRequest) {
    const event = await this.EventService.getEventByAlias(body.alias);
    if (!event) {
      throw new BadRequestError(ErrorMessage.NO_ALIAS_EXISTS(body.alias));
    }

    await this.EventService.updateEventOptions(event, body.options);

    return SuccessResponse.Positive;
  }

  @Post('/:eventId/sponsors')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async addSponsor(@SelectedEventID() event: EventDocument, @Body() body: AddSponsorRequest) {
    const sponsor = await this.AdminService.getAdminById(body.sponsorId);
    await this.EventService.addSponsorToEvent(event, sponsor);

    return SuccessResponse.Positive;
  }

  @Post('/:eventId/organisers')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async addOrganiser(@SelectedEventID() event: EventDocument, @Body() body: AddOrganiserRequest) {
    const organiser = await this.AdminService.getAdminById(body.organiserId);
    await this.EventService.addOrganiserToEvent(event, organiser);

    return SuccessResponse.Positive;
  }

  @Get('/:eventId/users')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async getUsers(@AuthorisedAdmin() admin: Admin, @SelectedEventID() event: EventDocument): Promise<TESCUser[]> {
    let users: TESCUser[];
    const isOrganiser = await this.EventService.isAdminOrganiser(event.alias, admin);
    const isSponsor = await this.EventService.isAdminSponsor(event.alias, admin);
    if (isOrganiser) {
      users = await this.UserService.getAllUsersByEvent(event);
    } else if (isSponsor) {
      users = await this.SponsorService.getSponsorApplicantsByEvent(event);
    } else {
      throw new ForbiddenError(ErrorMessage.PERMISSION_ERROR());
    }

    return users;
  }

  @Get('/:eventId/teams')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async getTeams(@AuthorisedAdmin() admin: Admin, @SelectedEventID() event: EventDocument): Promise<TESCTeam[]> {
    const isOrganiser = await this.EventService.isAdminOrganiser(event.alias, admin);
    if (!isOrganiser) {
      throw new ForbiddenError(ErrorMessage.PERMISSION_ERROR());
    }

    const teams = await this.TeamService.getTeamsByEvent(event);
    return Promise.all(teams.map(this.TeamService.populateTeammatesAdminFields))
  }

  @Patch('/:eventId/teams')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async updateTeam(
    @AuthorisedAdmin() admin: Admin,
    @SelectedEventID() event: EventDocument,
    @Body() req: UpdateTeamRequest
  ) {
    const isOrganiser = await this.EventService.isAdminOrganiser(event.alias, admin);
    if (!isOrganiser) {
      throw new BadRequestError(ErrorMessage.PERMISSION_ERROR());
    }

    const teamId = req._id
    if (!teamId) throw new BadRequestError('The team ID must be included in the request')
    
    const team: TESCTeam = await this.TeamService.getTeamById(teamId)
    if (!team) throw new BadRequestError(`No team with ID ${teamId} found`);

    await this.TeamService.updateTeamById(teamId, Object.assign(team, req));
    return SuccessResponse.Positive;
  }


  @Post('/:eventId/teams/:teamId/add-members')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async addTeamMembers(
    @AuthorisedAdmin() admin: Admin,
    @SelectedEventID() event: EventDocument,
    @SelectedTeamID() team: TeamDocument,
    @Body() req: AddTeamMembersRequest
  ) {
    const isOrganiser = await this.EventService.isAdminOrganiser(event.alias, admin);
    if (!isOrganiser) {
      throw new BadRequestError(ErrorMessage.PERMISSION_ERROR());
    }

    const currentUserAccounts = team.members;
    const newUserAccounts = await Promise.all(
      req.emails.map(async email => {
        const user = await this.UserService.getUserByEventAndEmail(email, event);
        if (!user) throw new BadRequestError(ErrorMessage.NO_ACCOUNT_EXISTS());
        if (user.team && user.team._id.equals(team._id)) throw new BadRequestError(ErrorMessage.USER_ON_TEAM());

        return user;
      })
    );

    if (newUserAccounts.length + currentUserAccounts.length > MAX_TEAM_SIZE) throw new BadRequestError(ErrorMessage.TEAM_FULL(team.code, MAX_TEAM_SIZE))
    
    await Promise.all(
      newUserAccounts.map(user => this.UserService.changeUserTeam(user, team))
    );

    return SuccessResponse.Positive;
  }

  @Post('/:eventId/teams/:teamId/remove-members')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async removeTeamMembers(
    @AuthorisedAdmin() admin: Admin,
    @SelectedEventID() event: EventDocument,
    @SelectedTeamID() team: TeamDocument,
    @Body() req: RemoveTeamMembersRequest
  ) {
    const isOrganiser = await this.EventService.isAdminOrganiser(event.alias, admin);
    if (!isOrganiser) {
      throw new BadRequestError(ErrorMessage.PERMISSION_ERROR());
    }

    const removedUserAccounts = await Promise.all(
      req.emails.map(async email => {
        const user = await this.UserService.getUserByEventAndEmail(email, event);
        if (!user) throw new BadRequestError(ErrorMessage.NO_ACCOUNT_EXISTS());
        if (!user.team || !user.team._id.equals(team._id)) throw new BadRequestError(ErrorMessage.USER_NOT_ON_TEAM());

        return user;
      })
    );
    
    await Promise.all(
      removedUserAccounts.map(user => this.UserService.changeUserTeam(user, undefined))
    );

    return SuccessResponse.Positive;
  }

  @Get('/:eventId/sponsor-users')
  @UseBefore(RoleAuth(Role.ROLE_SPONSOR))
  @UseBefore(ValidateEventID)
  async getSponsorUsers(@AuthorisedAdmin() admin: Admin, @SelectedEventID() event: EventDocument): Promise<TESCUser[]> {
    const isOrganiser = await this.EventService.isAdminOrganiser(event.alias, admin);
    const isSponsor = await this.EventService.isAdminSponsor(event.alias, admin);
    if (isSponsor || isOrganiser) {
      return await this.SponsorService.getSponsorApplicantsByEvent(event);
    }

    throw new ForbiddenError(ErrorMessage.PERMISSION_ERROR());
  }

  @Post('/:eventId/checkin')
  @UseBefore(RoleAuth(Role.ROLE_ADMIN))
  @UseBefore(ValidateEventID)
  async checkinUser(@AuthorisedAdmin() admin: Admin, @SelectedEventID() event: EventDocument,
    @Body() request: CheckinUserRequest): Promise<SuccessResponse> {
    const isOrganiser = await this.EventService.isAdminOrganiser(event.alias, admin);
    if (!isOrganiser) {
      throw new ForbiddenError(ErrorMessage.PERMISSION_ERROR());
    }

    await this.UserService.checkinUserById(request.id);
    return SuccessResponse.Positive;
  }
}
