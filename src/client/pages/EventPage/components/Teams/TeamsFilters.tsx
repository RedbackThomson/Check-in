import { TESCTeam } from '@Shared/ModelTypes';
import { UserStatus } from '@Shared/UserStatus';
import classNames from 'classnames';
import React from 'react';
import FA from 'react-fontawesome';
import { TeamStatus, getTeamStatus } from '~/static/Teams';
import { ColumnDefinitions } from '~/static/Types';

import BaseFilter from './Filters/BaseFilter';
import EnumFilter, { EnumOperation } from './Filters/EnumFilter';
import NumberFilter, { NumberOperation } from './Filters/NumberFilter';
import StringFilter, { StringOperation } from './Filters/StringFilter';
import SelectAllCheckbox, { CheckboxState } from './SelectAllCheckbox';

enum AdmittedSelectOption {
  ALL,
  ADMITTED,
  NOT_ADMITTED,
}

interface TeamsFiltersProps {
  teams: TESCTeam[];
  columns: ColumnDefinitions;
  selectAllState: CheckboxState;

  onFilteredChanged: (newFiltered: Set<string>) => void;
  onSelectAll: () => void;
}

interface TeamsFiltersState {
  activeFilters: BaseFilter[];
  admittedSelection: AdmittedSelectOption;
  showNewFilterMenu: boolean;
}

export default class TeamsFilters extends React.Component<TeamsFiltersProps, TeamsFiltersState> {
  admittedTeams: Set<string> = new Set();
  notAdmittedTeams: Set<string> = new Set();

  constructor(props: TeamsFiltersProps) {
    super(props);

    this.state = {
      activeFilters: [
        new StringFilter('university', 'University', StringOperation.CONTAINS, 'San Diego'),
        new EnumFilter<UserStatus>('status', 'Status', EnumOperation.INCLUDES, UserStatus.Late, UserStatus.NoStatus),
      ],
      admittedSelection: AdmittedSelectOption.ALL,
      showNewFilterMenu: false,
    };

    this.constructAdmitted(props.teams);
    this.constructNotAdmitted(props.teams);

    this.onFilterChanged();
  }

  componentDidUpdate(prevProps: TeamsFiltersProps) {
    const newTeams = this.props.teams;

    if (newTeams !== prevProps.teams) {
      this.constructAdmitted(newTeams);
      this.constructNotAdmitted(newTeams);

      this.onFilterChanged();
    }
  }

  /**
   * Constructs the list of all teams that have been admitted.
   */
  constructAdmitted = (teams: TESCTeam[]) => {
    const admittedStatuses: Set<TeamStatus> = new Set([UserStatus.Confirmed, UserStatus.Unconfirmed,
    UserStatus.Declined, UserStatus.Late]);

    this.admittedTeams = new Set(
      this.props.teams
        .filter(team => admittedStatuses.has(getTeamStatus(team.teammates)))
        .map(team => team._id)
    );
  };

  /**
   * Constructs the list of all teams that are not admitted.
   */
  constructNotAdmitted = (teams: TESCTeam[]) => {
    const notAdmittedStatuses: Set<TeamStatus> = new Set([UserStatus.NoStatus, UserStatus.Waitlisted]);

    this.notAdmittedTeams = new Set(
      this.props.teams
        .filter(team => notAdmittedStatuses.has(getTeamStatus(team.teammates)))
        .map(team => team._id)
    );
  };

  /**
   * Triggers a full filter and calls the prop to update.
   */
  onFilterChanged = () => {
    const { teams } = this.props;
    const { admittedSelection } = this.state;

    let customFilteredTeams: TESCTeam[];
    // Apply faster admission selection filter first.
    switch (admittedSelection) {
      case (AdmittedSelectOption.ADMITTED):
        customFilteredTeams = teams.filter(team => this.admittedTeams.has(team._id));
        break;
      case (AdmittedSelectOption.NOT_ADMITTED):
        customFilteredTeams = teams.filter(team => this.notAdmittedTeams.has(team._id));
        break;
      default:
        customFilteredTeams = teams;
        break;
    }

    customFilteredTeams = this.applyAllFilters(customFilteredTeams);

    this.props.onFilteredChanged(new Set(customFilteredTeams.map(team => team._id)));
  };

  /**
   * Determines whether two sets of teams are equivalent.
   */
  areTeamSetsEqual = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every(value => b.has(value));

  /**
   * Changes the filtered set to a new set.
   */
  changeAdmissionFilter = (newOption: AdmittedSelectOption) => {
    this.setState({
      admittedSelection: newOption,
    }, () => this.onFilterChanged());
  }

  /**
   * Opens or closes the new filter menu.
   */
  toggleNewFilterMenu = () => {
    this.setState({
      showNewFilterMenu: !this.state.showNewFilterMenu,
    });
  };

  /**
   * Applies each of the team filters in order and returns the new list of teams.
   */
  applyAllFilters = (teams: TESCTeam[]): TESCTeam[] => {
    const { activeFilters: filters } = this.state;
    let newTeams = teams;

    // Iterate through all filters and apply them in order.
    filters.forEach(filter => {
      newTeams = filter.applyFilter(newTeams);
    });

    return newTeams;
  };

  /**
   * Removes a filter by its index within the filters list.
   * @param index The index of the filter within the filters list.
   */
  removeFilter(index: number) {
    const { activeFilters } = this.state;
    this.setState({
      activeFilters: [...activeFilters.slice(0, index), ...activeFilters.slice(index + 1)],
    }, () => this.onFilterChanged());
  }

  renderNewFilterMenu = () => {
    if (!this.state.showNewFilterMenu) {
      return <></>;
    }

    return (
      <div className="row teams-filters teams-filters--border" />
    );
  };

  renderAdmittedButtons = (teams: TESCTeam[]) => {
    const { admittedSelection } = this.state;

    const baseClasses = ['btn', 'teams-filters__button'];
    const allTeamsClasses = classNames(baseClasses, {
      'teams-filters__button--active': admittedSelection === AdmittedSelectOption.ALL,
    });
    const admittedTeamsClasses = classNames(baseClasses, {
      'teams-filters__button--active': admittedSelection === AdmittedSelectOption.ADMITTED,
    });
    const notAdmittedTeamsClasses = classNames(baseClasses, {
      'teams-filters__button--active': admittedSelection === AdmittedSelectOption.NOT_ADMITTED,
    });

    return (
      <div className="btn-group" role="group">
        <button
          type="button"
          className={allTeamsClasses}
          onClick={() => this.changeAdmissionFilter(AdmittedSelectOption.ALL)}
        >
          All Teams <span className="badge badge-light">{teams.length}</span>
        </button>
        <button
          type="button"
          className={admittedTeamsClasses}
          onClick={() => this.changeAdmissionFilter(AdmittedSelectOption.ADMITTED)}
        >
          Admitted <span className="badge badge-light">{this.admittedTeams.size}</span>
        </button>
        <button
          type="button"
          className={notAdmittedTeamsClasses}
          onClick={() => this.changeAdmissionFilter(AdmittedSelectOption.NOT_ADMITTED)}
        >
          Not Admitted <span className="badge badge-light">{this.notAdmittedTeams.size}</span>
        </button>
      </div>
    );
  }

  render() {
    const { teams, onSelectAll, selectAllState } = this.props;
    const { activeFilters } = this.state;

    const newFilterButtonClass = classNames(
      'btn teams-filters__button mr-2', {
        'teams-filters__button--new-closed': !this.state.showNewFilterMenu,
        'teams-filters__button--new-open': this.state.showNewFilterMenu,
      }
    );

    return (
      <>
        <div className="row teams-filters teams-filters--border">
          {this.renderAdmittedButtons(teams)}
        </div>

        <div className="row teams-filters teams-filters--secondary teams-filters--border">
          <SelectAllCheckbox
            className="teams-filters__checkbox sd-form__input-checkbox mr-2"
            onClick={onSelectAll}
            state={selectAllState}
          />

          <button className={newFilterButtonClass} type="button" onClick={this.toggleNewFilterMenu}>
            New Filter
          </button>

          {
            activeFilters.map((filter, i) => {
              return (
                <div key={filter.getDisplayText()} className="btn teams-filters__filter mr-2">
                  <FA name="times" className="teams-filters__filter-delete" onClick={() => this.removeFilter(i)} />
                  {filter.getDisplayText()}
                </div>
              );
            })
          }
        </div>

        {this.renderNewFilterMenu()}
      </>
    );
  }
}