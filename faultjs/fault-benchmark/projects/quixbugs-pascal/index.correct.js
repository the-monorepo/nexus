export const pascal = (n) => {
  const rows = [[1]];
  for(let r = 1; r < n; r++) {
    const row = [];

    for (let c = 0; c < r + 1; c++) {
      const upleft = c > 0 ? rows[r - 1][c - 1] : 0;
      const upright = c < r ? rows[r - 1][c] : 0;
      row.push(upleft + upright);
    }

    rows.push(row);
  }

  return rows;
}

/*
export const pascal = (n) => {
  const rows = [[1]];
  for(let r = 1; r < n; r++) {
    const row = [];

    for (let c = 0; c <= r; c++) {
      const upleft = c > 0 ? rows[r - 1][c - 1] : 0;
      const upright = c < r ? rows[r - 1][c] : 0;
      row.push(upleft + upright);
    }

    rows.push(row);
  }

  return rows;
}
*/