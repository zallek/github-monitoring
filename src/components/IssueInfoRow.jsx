import React, {PropTypes} from 'react';
import {Panel} from 'react-bootstrap';
import _ from 'lodash';

import { ISSUE_WARNINGS, ISSUE_STATUS } from 'constants/issue';

import 'font-awesome/css/font-awesome.css';
import './IssueInfoRow.scss';

/**
 * #12 <title> <dateStart> <status> [Deps:<dependenciesStatus>] [Warnings]
 * Colored qccording to status
 */
const IssueInfoRow = React.createClass({

  displayName: 'IssueInfoRow',

  propTypes: {
    id: PropTypes.string.isRequired,
    fetched: PropTypes.bool.isRequired,
    href: PropTypes.string,
    title: PropTypes.string,
    dateStart: PropTypes.string,
    status: PropTypes.oneOf(_.values(ISSUE_STATUS)),
    dependenciesStatus: PropTypes.oneOf(_.values(ISSUE_STATUS)),
    warnings: PropTypes.arrayOf(PropTypes.oneOf(_.values(ISSUE_WARNINGS))),
  },

  _formatDate(date) {
    return date.toString();
  },

  render() {
    let {id, href, fetched} = this.props;
    return (
      <Panel className="IssueInfoRow" /*style={{'backgroundColor': status.color}}*/>
        <a className="IssueInfoRow-id" href={href}>
          #{id}
        </a>
        {fetched ? this._renderInfo() : this._renderSpinner()}
      </Panel>
    );
  },

  _renderSpinner() {
    return (
      <i className="fa fa-circle-o-notch fa-spin"/>
    );
  },

  _renderInfo() {
    let {title, dateStart, status, dependenciesStatus, warnings} = this.props;
    return (
      <div className="IssueInfoRow-info">
        <span className="IssueInfoRow-title">
          {title}
        </span>
        <span className="IssueInfoRow-dateStart">
          {this._formatDate(dateStart)}
        </span>
        <span className="IssueInfoRow-status" title="Status" style={{'color': status.color}}>
          {status.label}
        </span>
        {dependenciesStatus &&
          <span className="IssueInfoRow-dependenciesStatus" title="Dependencies Status" style={{'color': dependenciesStatus.color}}>
            DEPS: {dependenciesStatus.label}
          </span>
        }
        {warnings &&
          <div className="IssueInfoRow-warnings">
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

export default IssueInfoRow;
