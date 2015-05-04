import React, {PropTypes} from 'react';
import {Panel} from 'react-bootstrap';
import _ from 'lodash';

import { ISSUE_WARNINGS, ISSUE_STATUS } from 'constants/issue';

import 'font-awesome/css/font-awesome.css';

/**
 * #12 <title> <dateStart> <status> [Deps:<dependenciesStatus>] [Warnings]
 * Colored qccording to status
 */
const IssueInfoRow = React.createClass({

  displayName: 'IssueInfoRow',

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
      <Panel className="IssueStatus"
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
      </Panel>
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

export default IssueInfoRow;
