/**
 * Gravity
 * @type Array<{gravity: <Integer>, label: <String>}>
 * @description Gravity: from 0 to 2, the lesser, the more important it is.
 */
export const ISSUE_WARNINGS = {
  DEPENDENCIES_NOT_DEPLOYED: {gravity: 0, abr: 'DEPS', title: 'Issue is deployed but some dependencies are not'},
  DEPENDENCIES_ITSELF: {gravity: 0, abr: 'DEPS', title: `reference it self as a dependencies`},
  DEPENDENCIES_CYCLIC(id) { return {gravity: 0, abr: 'DEPS', title: `dependency ${id} (child) is also a dependent (parent)`}; },
  DEPENDENCIES_CLOSED: {gravity: 1, abr: 'DEPS', title: 'Some dependencies are closed but not deployed'},
  NOT_DEPLOYED_ON_STAGING: {gravity: 1, abr: 'DEPLOY', title: 'Issue is deployed but not in staging'},
  NOT_CLOSED: {gravity: 2, abr: 'GITHUB', title: 'Issue is deployed but the ticket is not closed'},
};

export const WARNING_GRAVITY_COLOR = {
  0: 'red',
  1: 'orange',
  2: 'jaune',
};

export const ISSUE_STATUS = {
  BACKLOG: {step: 0, label: 'In Backlog', color: 'rgb(18, 23, 129)'},
  WORK_IN_PROGRESS: {step: 1, label: 'Working in progress', color: 'rgb(93, 161, 201)'},
  ON_HOLD: {step: 2, label: 'On Hold', color: 'rgb(227, 27, 21)'},
  CLOSED: {label: 'Closed', color: 'rgb(188, 188, 188)'},
  DEPLOYED_STATING: {step: 3, label: 'Deployed in staging', color: 'rgb(93, 195, 90)'},
  DEPLOYED_PRODUCTION: {step: 4, label: 'Deployed in production', color: 'rgb(50, 166, 46)'},
};

/**
 * Issue State
 * @type {Map}
 */
export const ISSUE_LABELS = {
  'status-1-backlog': {status: ISSUE_STATUS.BACKLOG},
  'status-2-this-week': {status: ISSUE_STATUS.BACKLOG},
  'status-3-development': {status: ISSUE_STATUS.WORK_IN_PROGRESS},
  'status-4-help-wanted': {status: ISSUE_STATUS.ON_HOLD},
  'status-5-waiting-for-review': {status: ISSUE_STATUS.WORK_IN_PROGRESS},
  'status-6-ready-for-stating': {status: ISSUE_STATUS.WORK_IN_PROGRESS},
  'deployed-staging': {status: ISSUE_STATUS.DEPLOYED_STATING},
  'deployed-production': {status: ISSUE_STATUS.DEPLOYED_PRODUCTION},
};

export const DEPENDENCY_PATTERN = /^DEPENDS ON #([\d]+)$/; //@TODO do not test case
