// The scoring rules: how a record's answers become points. The landscape page
// (index.html) and the scripts in scripts/ both use this file, so they always agree.
// The data file holds only the answers; the points are worked out from them.
//
// In the browser this file defines window.scoring. In Node.js, require() it.

(function (scoring) {
  // Each Lighthouse metric, and the metric whose direct URL it depends on. A page
  // without a direct URL can't be tested, so its Lighthouse metrics earn 0.
  const LIGHTHOUSE_NEEDS = { N4: "N1", N5: "N1", P7: "P1", P8: "P1" };

  // Points for a Lighthouse score from 0 to 100.
  function lighthousePoints(score) {
    if (score >= 90) return 5;
    if (score >= 80) return 4;
    if (score >= 70) return 3;
    if (score >= 60) return 2;
    if (score >= 50) return 1;
    return 0;
  }

  // The points a record earns on each metric, keyed by points field (G1 to P8), and
  // their sum as Total. criteria is the CRITERIA list in index.html: each metric's
  // points field (key), answer field (field), and maximum points (max).
  // A "Yes" earns the metric's full points, and any other answer earns 0.
  function scoreRecord(record, criteria) {
    const points = {};
    for (const c of criteria) {
      const answer = record[c.field];
      if (c.key in LIGHTHOUSE_NEEDS) {
        const direct = criteria.find(d => d.key === LIGHTHOUSE_NEEDS[c.key]);
        points[c.key] = record[direct.field] === "Yes" && Number.isInteger(answer) ? lighthousePoints(answer) : 0;
      } else {
        points[c.key] = answer === "Yes" ? c.max : 0;
      }
    }
    points.Total = criteria.reduce((sum, c) => sum + points[c.key], 0);
    return points;
  }

  scoring.LIGHTHOUSE_NEEDS = LIGHTHOUSE_NEEDS;
  scoring.lighthousePoints = lighthousePoints;
  scoring.scoreRecord = scoreRecord;
})(typeof module !== "undefined" && module.exports ? module.exports : (window.scoring = {}));
