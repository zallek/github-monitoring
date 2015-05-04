import React from 'react';
import { PropTypes, addons } from 'react/addons';
const { update } = addons;
import * as GithubApi from 'mock/github';
import _ from 'lodash';
import { ISSUE_WARNINGS, WARNING_GRAVITY_COLOR, ISSUE_STATUS, ISSUE_LABELS, DEPENDENCY_PATTERN } from 'constants/issue';

import 'font-awesome/css/font-awesome.css';

const GithubPropTypes = {
  repository: PropTypes.shape({
    user: PropTypes.string.isRequired,
    project: PropTypes.string.isRequired,
  }),
  issue: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
};

const IssueStatus = React.createClass({

  displayName: 'IssueStatus',

  propTypes: {
    repository: GithubPropTypes.repository.isRequired,
    issue: GithubPropTypes.issue.isRequired,
    displayDepedencies: PropTypes.bool,
  },

  getDefaultPropTypes() {
    return {
      displayDepedencies: false
    };
  },

  getInitialState() {
    return {
      topIssueId: this.props.issue.id,
      issuesList: {},
    };
  },

  _extractDependencies(issueComments) {
    return _.compact(_.map(issueComments, (comment) => {
      let matches = comment.match(DEPENDENCY_PATTERN);
      return matches && matches[1];
    }));
  },

  _computeDependenciesStatus(issueId) {
    let issuesList = this.state.issuesList,
        issue = issuesList[issueId],
        dependenciesIdDeep = this._getDependenciesIdDeep(issueId);

    let dependenciesStatus = _.map(dependenciesIdDeep, (id) => issuesList[id].status);
    dependenciesStatus = _.compact(dependenciesStatus); //Some dependencies might have no status
    dependenciesStatus = this._getLowestStatusStep(dependenciesStatus);

    this.setState(update(this.state, {
      issuesList: {
        [issueId]: {
          dependenciesStatus: {
            $set: dependenciesStatus,
          }
        }
      }
    }));

    _.each(issue.dependentsId, this._computeDependenciesStatus);
  },

  _getLowestStatusStep(statuses) {
    return _.sortBy(statuses, (status) => status.step)[0];
  },

  _computeWarnings(issueId) {

  },

  _addIssue({id, ...othersProps}) {
    this.setState(update(this.state, {
      issuesList: {
        $merge: {
          [id]: {
            id: id,
            dependenciesId: [],
            dependentsId: [],
            warnings: [],
            fetched: false,
            ...othersProps,
          }
        }
      }
    }));
  },

  _updateIssue({id, ...othersProps}) {
    this.setState(update(this.state, {
      issuesList: {
        [id]: {
          $merge: {
            ...othersProps,
          }
        }
      }
    }));
  },

  _getDependentsIdDeep(issueId) {
    let issueLists = this.state.issuesList;
    return _.flatten(_.map(issueLists[issueId].dependentsId, (dependentId) => {
      return [dependentId].concat(this._getDependentsIdDeep(dependentId));
    }));
  },

  _getDependenciesIdDeep(issueId) {
    let issueLists = this.state.issuesList;
    return _.flatten(_.map(issueLists[issueId].dependenciesId, (dependencyId) => {
      return [dependencyId].concat(this._getDependenciesIdDeep(dependencyId));
    }));
  },

  _fetchIssue(issueId) {
    let {
      repository: { user, project },
    } = this.props;

    GithubApi.getIssueInfo({user, project, issueId}, (response) => {
      let dependenciesId = this._extractDependencies(response.comments);

      let labels = _.uniq(_.filter(ISSUE_LABELS, ({status}, label) => _.contains(response.labels, label)));
      let status = this._getLowestStatusStep(_.pluck(labels, 'status'));
      let warnings = [];

      this._updateIssue({
        id: issueId,
        href: response.href,
        title: response.title,
        dateStart: response.dateStart,
        status: status,
        fetched: true,
      });

      _.each(dependenciesId, (dependencyId) => {
        //Check if equal
        if (dependencyId === issueId) {
          warnings.push(ISSUE_WARNINGS.DEPENDENCIES_ITSELF);
          return;
        }

        let issueExists = !!this.state.issuesList[dependencyId];
        //Add if not exist
        if (!issueExists) {
          this._addIssue({
            id: dependencyId,
          });
          this._fetchIssue(dependencyId);
        }

        let dependentsIdDeep = this._getDependentsIdDeep(issueId),
            includedInDependents = _.contains(dependentsIdDeep, dependencyId);

        if (includedInDependents) {
          warnings.push(ISSUE_WARNINGS.DEPENDENCIES_CYCLIC(dependencyId));
          return;
        }
        else {
          //Add dependencyId to issueId's dependencies
          this.setState(update(this.state, {
            issuesList: {
              [issueId]: {
                dependenciesId: {
                  $push: [dependencyId],
                }
              }
            }
          }));
          //Add issueId to dependencyId's dependents
          this.setState(update(this.state, {
            issuesList: {
              [dependencyId]: {
                dependentsId: {
                  $push: [issueId],
                }
              }
            }
          }));
        }
      });

      let dependenciesStatus = this._computeDependenciesStatus(issueId);
      this._updateIssue({
        id: issueId,
        dependenciesStatus: dependenciesStatus,
      });

      warnings.concat(this._computeWarnings(issueId));
      this.setState(update(this.state, {
        issuesList: {
          [issueId]: {
            warnings: {
              $push: warnings,
            }
          }
        }
      }));
    });
  },

  componentWillMount() {
    let {topIssueId} = this.state;
    this._addIssue({id: topIssueId});
    this._fetchIssue(topIssueId);
  },

  render() {
    let {topIssueId} = this.state,
        {displayDepedencies} = this.props,
        dependenciesId = this._getDependenciesIdDeep(topIssueId);
    return (
      <div className="IssueMonitoring">
        <div className="IssueMonitoring-issue">
          {this._renderIssueInfo(topIssueId)}
        </div>
        {displayDepedencies && dependenciesId.length > 0 &&
          <div className="IssueMonitoring-dependencies">
            <h2 className="IssueMonitoring-dependenciesTitle">
              Dependencies
            </h2>
            <div className="IssueMonitoring-dependenciesList">
              {dependenciesId.map(this._renderIssueInfo)}
            </div>
          </div>
        }
      </div>
    );
  },

  _renderIssueInfo(issueId) {
    let issueState = this.state.issuesList[issueId];
    if (!issueState.fetched) {
      return (
        <i className="fa fa-circle-o-notch fa-spin"/>
      );
    }
    return (
      <IssueRowInfo {...issueState}/>
    );
  },

});

/**
 * #12 <title> <dateStart> <status> [Deps:<dependenciesStatus>] [Warnings]
 * Colored qccording to status
 */
const IssueRowInfo = React.createClass({

  displayName: 'IssueRowInfo',

  propTypes: {
    id: PropTypes.string.isRequired,
    href: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    dateStart: PropTypes.string.isRequired,
    status: PropTypes.oneOf(_.values(ISSUE_STATUS)).isRequired,
    dependenciesStatus: PropTypes.oneOf(_.values(ISSUE_STATUS)),
    warnings: PropTypes.arrayOf(PropTypes.oneOf(_.values(ISSUE_WARNINGS))),
  },

  _formatDate(date) {
    return date.toString();
  },

  render() {
    let {id, href, title, dateStart, status, dependenciesStatus, warnings} = this.props;
    return (
      <div className="IssueStatus"
           /*style={{'backgroundColor': status.color}}*/>
        <a className="IssueStatus-id" href={href}>
          #{id}
        </a>
        <span className="IssueStatus-title">
          {title}
        </span>
        <span className="IssueStatus-dateStart">
          {this._formatDate(dateStart)}
        </span>
        <span className="IssueStatus-status" style={{'color': status.color}}>
          {status.label}
        </span>
        {dependenciesStatus &&
          <span className="IssueStatus-dependenciesStatus" style={{'color': dependenciesStatus.color}}>
            Deps: {dependenciesStatus.label}
          </span>
        }
        {warnings &&
          <div className="IssueStatus-warnings">
            {warnings.map((warning) => (
              <IssueWarning {...warning}/>
            ))}
          </div>
        }
      </div>
    );
  },

});

const IssueWarning = React.createClass({

  displayName: 'IssueWarning',

  propTypes: {
    title: PropTypes.string.isRequired,
    abr: PropTypes.string,
    iconClassName: PropTypes.string,
    color: PropTypes.string,
  },

  getDefaultPropTypes() {
    return {
      iconClassName: 'fa fa-warning',
      color: 'red',
    };
  },

  render() {
    let {title, abr, iconClassName, color} = this.props;
    return (
      <div className="IssueWarning"
           style={{'color': color}}
           title={title}>
        <i className={iconClassName}/>
        <span className="IssueWarning-abr">{abr}</span>
      </div>
    );
  },

});

export default IssueStatus;
export {GithubPropTypes};
