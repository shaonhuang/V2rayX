const versionCompare = (latest: string, curr: string) => {
  if (!latest || !curr || latest === curr) {
    return false;
  }

  const latestArr = latest.split('.');
  const currArr = curr.split('.');
  for (let i = 0; i < latestArr.length; i += 1) {
    if (+latestArr[i] !== +currArr[i]) {
      return +latestArr[i] > +currArr[i];
    }
  }
  return false;
};

export { versionCompare };
