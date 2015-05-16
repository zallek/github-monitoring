const LABELS = [
  'status-1-backlog',
  'status-2-this-week',
  'status-3-development',
  'status-4-help-wanted',
  'status-5-waiting-for-review',
  'status-6-ready-for-stating',
  'deployed-staging',
  'deployed-production',
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function pickRandom(array) {
  return array[randomInt(0, array.length - 1)];
}

function generateRandomComments() {
  let comments = [];
  //Useless comments
  for (let i = 0; i < randomInt(0, 20); i++) {
    comments.push('Useless comments #1');
  }
  //Depends comments
  //Max 3, chance: (30%^X) to get X
  for (let i = 0; i < 3; i++) {
    let random = randomInt(1, 100);
    if (random <= 0) {
      comments.push(`DEPENDS ON #${randomInt(1, 100)}`);
    }
  }
  return comments;
}

export function fetchIssue({user, project, issueId}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        title: `Title ${issueId}`,
        href: `https://github.com/${user}/{project}/issues/{issueId}`,
        dateStart: '2015-05-01',
        labels: pickRandom(LABELS),
        comments: generateRandomComments(),
      });
    }, 500);
  });
}
