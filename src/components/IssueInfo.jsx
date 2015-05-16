import React, {PropTypes} from 'react';
import {Panel} from 'react-bootstrap';
import _ from 'lodash';

import { ISSUE_WARNINGS, ISSUE_STATUS } from 'constants/IssueConstants';

import 'font-awesome/css/font-awesome.css';
import './IssueInfo.scss';


const _PropTypes = {
  issue: PropTypes.shape({
    id: PropTypes.shape({
      user: PropTypes.string.isRequired,
      project: PropTypes.string.isRequired,
      id: PropTypes.string.isRequired,
    }).isRequired,
    pending: PropTypes.bool.isRequired,
    href: PropTypes.string,
    title: PropTypes.string,
    dateStart: PropTypes.string,
    status: PropTypes.oneOf(_.values(ISSUE_STATUS)),
    dependenciesStatus: PropTypes.oneOf(_.values(ISSUE_STATUS)),
    warnings: PropTypes.arrayOf(PropTypes.oneOf(_.values(ISSUE_WARNINGS))),
  }),
};

/**
 * #12 <title> <dateStart> <status> [Deps:<dependenciesStatus>] [Warnings]
 * Colored qccording to status
 */
const IssueInfo = React.createClass({

  displayName: 'IssueInfo',

  propTypes: {
    issue: _PropTypes.issue.isRequired,
  },

  _formatDate(date) {
    return date.toString();
  },

  render() {
    let {id, href, pending} = this.props.issue;
    console.log(this.props.issue.dateStart);
    console.log(pending);
    return (
      <Panel className="IssueInfo" /*style={{'backgroundColor': status.color}}*/>
        <a className="IssueInfo-id" href={href}>
          #{id}
        </a>
        {!pending ? this._renderInfo() : this._renderSpinner()}
      </Panel>
    );
  },

  _renderSpinner() {
    return (
      <i className="fa fa-circle-o-notch fa-spin"/>
    );
  },

  _renderInfo() {
    let {title, dateStart, status, dependenciesStatus, warnings} = this.props.issue;
    return (
      <div className="IssueInfo-info">
        <span className="IssueInfo-title">
          {title}
        </span>
        <span className="IssueInfo-dateStart">
          {this._formatDate(dateStart)}
        </span>
        <span className="IssueInfo-status" title="Status" style={{'color': status.color}}>
          {status.label}
        </span>
        {dependenciesStatus &&
          <span className="IssueInfo-dependenciesStatus" title="Dependencies Status" style={{'color': dependenciesStatus.color}}>
            DEPS: {dependenciesStatus.label}
          </span>
        }
        {warnings &&
          <div className="IssueInfo-warnings">
            {warnings.map((warning, i) => (
              <IssueWarning key={i} {...warning}/>
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
      iconClassName: 'fa fa-exclamation-triangle',
      color: 'red',
    };
  },

  render() {
    let {title, abr, iconClassName, color, ...otherProps} = this.props;
    return (
      <span className="IssueWarning"
           style={{'color': color}}
           title={title}
           {...otherProps}>
        <i className={iconClassName}/>
        <span className="IssueWarning-abr">{abr}</span>
      </span>
    );
  },

});

IssueInfo.PropTypes = _PropTypes;
export default IssueInfo;
