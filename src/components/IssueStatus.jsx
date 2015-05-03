import React from 'react';
import { PropTypes, addons } from 'react/addons';
const { update } = addons;
import * as GithubApi from 'lib/github';
import _ from 'lodash';
import { ISSUE_WARNINGS, WARNING_GRAVITY_COLOR, ISSUE_STATUS, ISSUE_LABELS, DEPENDENCY_PATTERN } from 'constants/issue';

import 'font-awesome/css/font-awesome.css';

const GithubPropTypes = {
  repository: PropTypes.shape({
    user: PropTypes.string.isRequiered,
    project: PropTypes.string.isRequiered,
  }),
  issue: PropTypes.shape({
    id: PropTypes.number.isRequiered,
  }),
};

const IssueStatus = React.createClass({

  displayName: 'IssueStatus',

  propTypes: {
    repository: GithubPropTypes.repository.isRequiered,
    issue: GithubPropTypes.issue.isRequiered,
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
        dependenciesStatus = _.map(issue.dependenciesId, (id) => [issuesList[id].status, issuesList[id].dependenciesStatus]);

    dependenciesStatus = _.compact(_.flatten(dependenciesStatus));
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

  _addIssue({id, dependenciesId = [], dependentsId = []}) {
    this.setState(update(this.state, {
      issuesList: {
        $merge: {
          [id]: {
            id: id,
            dependenciesId: dependenciesId,
            dependentsId: dependentsId,
            fetched: false,
          }
        }
      }
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

      _.each(dependenciesId, (dependencyId) => {
        let issue = _.find(this.state.issuesList, {id: dependencyId});
        if (!issue) {
          this._addIssue({id: dependencyId, dependentsId: [issueId]});
          this._fetchIssue(dependencyId);
        } else {
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

      this.setState(update(this.state, {
        issuesList: {
          [issueId]: {
            $merge: {
              href: response.href,
              title: response.title,
              dateStart: response.dateStart,
              status: status,
              dependenciesId: dependenciesId,
              dependenciesStatus: [],
              fetched: true,
            }
          }
        }
      }));

      this._computeDependenciesStatus(issueId);
      this._computeWarnings(issueId);
    });
  },

  componentWillMount() {
    this._addIssue({id: this.state.topIssueId});
    this._fetchIssue(this.state.topIssueId);
  },

  render() {
    let {topIssueId, issuesList} = this.state,
        {displayDepedencies} = this.props,
        dependenciesId = issuesList[topIssueId].dependenciesId;
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
    id: PropTypes.number.isRequiered,
    href: PropTypes.string.isRequiered,
    title: PropTypes.string.isRequiered,
    dateStart: PropTypes.string.isRequiered,
    status: PropTypes.oneOf(ISSUE_STATUS).isRequiered,
    dependenciesStatus: PropTypes.oneOf(ISSUE_STATUS),
    warnings: PropTypes.array(PropTypes.oneOf(ISSUE_WARNINGS)),
  },

  _formatDate(date) {
    return date.toString();
  },

  render() {
    let {id, href, title, dateStart, status, dependenciesStatus, warnings} = this.props;
    return (
      <div className="IssueStatus"
           style={{'backgroundColor': status.color}}>
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
    title: PropTypes.string.isRequiered,
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
