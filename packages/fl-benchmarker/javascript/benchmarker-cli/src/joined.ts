import 'source-map-support/register.js';
import { readFile } from 'fs/promises';
import { readJson } from '@pshaw/fs';
import { resolve } from 'path';

import { locationToKeyIncludingEnd } from '@fault/addon-mutation-localization';
import { recordFaults, convertFileFaultDataToFaults } from '@fault/record-faults';

import { requestProjectDirs } from './requestProjectDirs.ts';

// TODO: This is just a temporary script to see if FaultJs does better with SBFL techniques
const algos = ['dstar-2', 'op2'];
const main = async () => {
  const mutations = [];
  const statements = [];
  const projectDirs = await requestProjectDirs('*');
  for (const dir of projectDirs) {
    try {
      const faultData = await readJson(resolve(dir, 'faults/mbfl/faults.json'));
      const mbflResults = convertFileFaultDataToFaults(faultData);
      mutations.push(mbflResults.length);
      statements.push(
        await readFile(resolve(dir, 'faults/mbfl/mutations-attempted.txt'), 'utf8'),
      );
      const index = mbflResults.findIndex(
        (fault) =>
          fault.other.evaluation.length <= 0 ||
          fault.other.evaluation[0].evaluation.overallPositiveEffect === 0,
      );
      for (const algo of algos) {
        try {
          const filePath = resolve(dir, `faults/mbfl-${algo}/faults.json`);
          if (index === -1) {
            await recordFaults(filePath, mbflResults);
          } else {
            const faultData = await readJson(resolve(dir, `faults/${algo}/faults.json`));
            const otherResults = convertFileFaultDataToFaults(faultData);
            const scores = new Map();
            for (const fault of otherResults) {
              scores.set(
                locationToKeyIncludingEnd(fault.sourcePath, fault.location),
                fault.score,
              );
            }
            const fineScores = mbflResults.slice(0, index);
            let lowestFineScore = Math.min(...fineScores.map((fault) => fault.score)) - 1;
            const mappedFineScores = fineScores.map((fault) => ({
              ...fault,
              score: lowestFineScore--,
            }));
            const newResults = mappedFineScores.concat(
              mbflResults
                .slice(index)
                .sort((a, b) => {
                  const key1 = locationToKeyIncludingEnd(a.sourcePath, a.location);
                  const key2 = locationToKeyIncludingEnd(b.sourcePath, b.location);
                  const result = scores.get(key2) - scores.get(key1);
                  return result;
                })
                .map((fault) => ({ ...fault, score: lowestFineScore-- })),
            );
            await recordFaults(filePath, newResults);
          }
          console.log('Finished!', dir, algo);
        } catch (err) {
          console.error(dir, algo, err.message);
        }
      }
    } catch (err) {
      console.error(dir, err.message);
    }
  }
  console.log(statements.join(','));
  console.log(mutations.join(','));
};
main();
