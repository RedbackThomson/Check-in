import { Inject, Container } from 'typedi';
import { EventModel, EventDocument } from '@Models/Event';
import { UserModel } from '@Models/User';
import { AccountModel } from '@Models/Account';
import { 
  TESCEvent, 
  TESCAccount, 
  TESCUser, 
  TESCTeam, 
  Admin as TESCAdmin, 
  Download as TESCDownload } from '@Shared/ModelTypes';
import { RegisterUserRequest } from '@Shared/api/Requests';
import { TeamModel } from '@Models/Team';
import { AdminModel } from '@Models/Admin';
import { Role } from '@Shared/Roles';
import { DownloadModel } from '@Models/Download';

const Event = Container.get<EventModel>('EventModel');
const User = Container.get<UserModel>('UserModel');
const Account = Container.get<AccountModel>('AccountModel');
const Team = Container.get<TeamModel>('TeamModel');
const Admin = Container.get<AdminModel>('AdminModel');
const Download = Container.get<DownloadModel>('DownloadModel');

const baseTESCEvent = (): TESCEvent => ({
  name: 'TESC Event',
  alias: 'tesc-event',
  organisers: [],
  organisedBy: 'TESC',
  closeTime: new Date().toString(),
  sponsors: [],
  homepage: 'www.tesc.ucsd.edu',
  description: 'TESC Event Description',
  email: 'hello@tesc.ucsd.edu',
  logo: {
    name: 'logo',
    size: 123,
    type: 'img/png',
    url: ''
  },
  customQuestions: {},
  options: {
    allowHighSchool: false,
    mlhProvisions: false,
    allowOutOfState: false,
    foodOption: false,
    requireResume: false,
    allowTeammates: false,
    requireDiversityOption: false,
    requireClassRequirement: false,
    requireExtraCurriculars: false,
    requireGPA: false,
    enableGPA: false,
    requireMajorGPA: false,
    requireWhyThisEvent: false
  },
});

const baseTESCAccount = (): TESCAccount => ({
  email: 'hello@tesc.ucsd.edu',
  password: 'abcde',
  confirmed: false,
  deleted: false
});

const baseTESCAdmin = (): TESCAdmin => ({
  username: 'fake-admin',
  password: 'hunter2',
  role: Role.ROLE_ADMIN,
  checkin: false,
  lastAccessed: new Date(),
  deleted: false
})

const baseTESCUser = (): TESCUser => ({
  firstName: 'First',
  lastName: 'Last',
  birthdate: new Date().toString(),
  gender: 'Female',
  phone: '1234567890',
  shareResume: false,
  event: baseTESCEvent(),
  account: baseTESCAccount(),
});

const baseTESCDownload = (): TESCDownload => ({
  fileCount: 42,
  admin: null,
  accessUrl: 'something.aws.com',
  error: false,
  fulfilled: false,
  deleted: false
})

const baseTESCTeam = (): TESCTeam => ({
  event: baseTESCEvent(),
  code: 'L33T',
  members: []
});

const baseApplication = (): RegisterUserRequest => ({
  alias: 'some-event-alias',
  user: {
    email: 'fake@tesc.ucsd.edu',
    password: 'hunter2',
    teamCode: 'ABCD',
    firstName: 'TESC',
    lastName: 'Attendee',
    birthdate: new Date().toString(),
    gender: 'Female',
    phone: '123',
    shareResume: true,
    createTeam: false,
    customQuestionResponses: new Map<string, string>(),
    provision: false,
    accept: false
  }
})

export const generateFakeDownload = (p?: Partial<TESCDownload>): TESCDownload => {
  return {
    ...baseTESCDownload(),
    ...p
  }
}

export const generateFakeApplication = (p?: Partial<RegisterUserRequest>): RegisterUserRequest => {
  return {
    ...baseApplication(),
    ...p
  }
}

export const generateFakeUser = (p?: Partial<TESCUser>): TESCUser => {
  return {
    ...baseTESCUser(),
    ...p
  }
}

export const generateFakeEvent = (p?: Partial<TESCEvent>): TESCEvent => {
  return {
    ...baseTESCEvent(),
    ...p
  }
}

export const generateFakeAccount = (p?: Partial<TESCAccount>): TESCAccount => {
  return {
    ...baseTESCAccount(),
    ...p
  }
}

export const generateFakeTeam = (p?: Partial<TESCTeam>): TESCTeam => {
  return {
    ...baseTESCTeam(),
    ...p
  }
}

export const generateFakeAdmin = (p?: Partial<TESCAdmin>): TESCAdmin => {
  return {
    ...baseTESCAdmin(),
    ...p
  }
}

export const generateFakeEventDocument = (p?: Partial<TESCEvent>) => new Event(generateFakeEvent(p))

export const generateFakeUserDocument = (p?: Partial<TESCUser>) => new User(generateFakeUser(p))

export const generateFakeAccountDocument = (p?: Partial<TESCAccount>) => new Account(generateFakeAccount(p))

export const generateFakeTeamDocument = (p?: Partial<TESCTeam>) => new Team(generateFakeTeam(p));

export const generateFakeAdminDocument = (p?: Partial<TESCAdmin>) => new Admin(generateFakeAdmin(p));

export const generateFakeDownloadDocument = (p?: Partial<TESCDownload>) => new Download(generateFakeDownload(p));