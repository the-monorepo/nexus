import { cloneCoverage } from '../src/index.ts';
describe('cloneCoverage', () => {
  [
    {},
    {
      'packages\\@fault/tester-mocha\\lib\\index.js': {
        path: 'packages\\@fault/tester-mocha\\lib\\index.js',
        statementMap: {
          '0': {
            start: {
              line: 3,
              column: 0,
            },
            end: {
              line: 5,
              column: 3,
            },
          },
          '1': {
            start: {
              line: 6,
              column: 0,
            },
            end: {
              line: 6,
              column: 25,
            },
          },
          '2': {
            start: {
              line: 8,
              column: 13,
            },
            end: {
              line: 8,
              column: 53,
            },
          },
          '3': {
            start: {
              line: 10,
              column: 19,
            },
            end: {
              line: 10,
              column: 43,
            },
          },
          '4': {
            start: {
              line: 12,
              column: 19,
            },
            end: {
              line: 12,
              column: 43,
            },
          },
          '5': {
            start: {
              line: 14,
              column: 39,
            },
            end: {
              line: 14,
              column: 93,
            },
          },
          '6': {
            start: {
              line: 16,
              column: 12,
            },
            end: {
              line: 43,
              column: 1,
            },
          },
          '7': {
            start: {
              line: 17,
              column: 16,
            },
            end: {
              line: 22,
              column: 4,
            },
          },
          '8': {
            start: {
              line: 23,
              column: 2,
            },
            end: {
              line: 23,
              column: 50,
            },
          },
          '9': {
            start: {
              line: 24,
              column: 2,
            },
            end: {
              line: 24,
              column: 57,
            },
          },
          '10': {
            start: {
              line: 24,
              column: 32,
            },
            end: {
              line: 24,
              column: 55,
            },
          },
          '11': {
            start: {
              line: 26,
              column: 2,
            },
            end: {
              line: 42,
              column: 3,
            },
          },
          '12': {
            start: {
              line: 27,
              column: 21,
            },
            end: {
              line: 35,
              column: 6,
            },
          },
          '13': {
            start: {
              line: 28,
              column: 6,
            },
            end: {
              line: 34,
              column: 9,
            },
          },
          '14': {
            start: {
              line: 29,
              column: 8,
            },
            end: {
              line: 33,
              column: 9,
            },
          },
          '15': {
            start: {
              line: 30,
              column: 10,
            },
            end: {
              line: 30,
              column: 28,
            },
          },
          '16': {
            start: {
              line: 32,
              column: 10,
            },
            end: {
              line: 32,
              column: 20,
            },
          },
          '17': {
            start: {
              line: 36,
              column: 4,
            },
            end: {
              line: 38,
              column: 7,
            },
          },
          '18': {
            start: {
              line: 40,
              column: 4,
            },
            end: {
              line: 40,
              column: 23,
            },
          },
          '19': {
            start: {
              line: 41,
              column: 4,
            },
            end: {
              line: 41,
              column: 20,
            },
          },
          '20': {
            start: {
              line: 45,
              column: 15,
            },
            end: {
              line: 45,
              column: 18,
            },
          },
          '21': {
            start: {
              line: 46,
              column: 0,
            },
            end: {
              line: 46,
              column: 27,
            },
          },
        },
        fnMap: {
          '0': {
            name: '_interopRequireDefault',
            decl: {
              start: {
                line: 14,
                column: 9,
              },
              end: {
                line: 14,
                column: 31,
              },
            },
            loc: {
              start: {
                line: 14,
                column: 37,
              },
              end: {
                line: 14,
                column: 95,
              },
            },
            line: 14,
          },
          '1': {
            name: '(anonymous_1)',
            decl: {
              start: {
                line: 16,
                column: 12,
              },
              end: {
                line: 16,
                column: 13,
              },
            },
            loc: {
              start: {
                line: 16,
                column: 31,
              },
              end: {
                line: 43,
                column: 1,
              },
            },
            line: 16,
          },
          '2': {
            name: '(anonymous_2)',
            decl: {
              start: {
                line: 24,
                column: 20,
              },
              end: {
                line: 24,
                column: 21,
              },
            },
            loc: {
              start: {
                line: 24,
                column: 32,
              },
              end: {
                line: 24,
                column: 55,
              },
            },
            line: 24,
          },
          '3': {
            name: '(anonymous_3)',
            decl: {
              start: {
                line: 27,
                column: 39,
              },
              end: {
                line: 27,
                column: 40,
              },
            },
            loc: {
              start: {
                line: 27,
                column: 50,
              },
              end: {
                line: 35,
                column: 5,
              },
            },
            line: 27,
          },
          '4': {
            name: '(anonymous_4)',
            decl: {
              start: {
                line: 28,
                column: 16,
              },
              end: {
                line: 28,
                column: 17,
              },
            },
            loc: {
              start: {
                line: 28,
                column: 28,
              },
              end: {
                line: 34,
                column: 7,
              },
            },
            line: 28,
          },
        },
        branchMap: {
          '0': {
            loc: {
              start: {
                line: 14,
                column: 46,
              },
              end: {
                line: 14,
                column: 92,
              },
            },
            type: 'cond-expr',
            locations: [
              {
                start: {
                  line: 14,
                  column: 70,
                },
                end: {
                  line: 14,
                  column: 73,
                },
              },
              {
                start: {
                  line: 14,
                  column: 76,
                },
                end: {
                  line: 14,
                  column: 92,
                },
              },
            ],
            line: 14,
          },
          '1': {
            loc: {
              start: {
                line: 14,
                column: 46,
              },
              end: {
                line: 14,
                column: 67,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 14,
                  column: 46,
                },
                end: {
                  line: 14,
                  column: 49,
                },
              },
              {
                start: {
                  line: 14,
                  column: 53,
                },
                end: {
                  line: 14,
                  column: 67,
                },
              },
            ],
            line: 14,
          },
          '2': {
            loc: {
              start: {
                line: 29,
                column: 8,
              },
              end: {
                line: 33,
                column: 9,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 29,
                  column: 8,
                },
                end: {
                  line: 33,
                  column: 9,
                },
              },
              {
                start: {
                  line: 29,
                  column: 8,
                },
                end: {
                  line: 33,
                  column: 9,
                },
              },
            ],
            line: 29,
          },
        },
        s: {
          '0': 1,
          '1': 1,
          '2': 1,
          '3': 1,
          '4': 1,
          '5': 1,
          '6': 1,
          '7': 1,
          '8': 1,
          '9': 1,
          '10': 3,
          '11': 1,
          '12': 1,
          '13': 1,
          '14': 0,
          '15': 0,
          '16': 0,
          '17': 0,
          '18': 0,
          '19': 0,
          '20': 1,
          '21': 1,
        },
        f: {
          '0': 1,
          '1': 1,
          '2': 3,
          '3': 1,
          '4': 0,
        },
        b: {
          '0': [0, 1],
          '1': [1, 1],
          '2': [0, 0],
        },
        inputSourceMap: {
          version: 3,
          sources: ['../src/index.ts'],
          names: [
            'run',
            'testPaths',
            'mocha',
            'Mocha',
            'allowUncaught',
            'color',
            'reporter',
            'IPCReporter',
            'fullStackTrace',
            'addFile',
            'require',
            'resolve',
            'forEach',
            'testPath',
            'failures',
            'Promise',
            'passed',
            'err',
            'console',
            'error',
            'process',
            'exit',
          ],
          mappings:
            ';;;;;;;AAAA;;AACA;;AACA;;;;AACA,MAAMA,GAAG,GAAG,MAAMC,SAAN,IAAmB;AAC7B,QAAMC,KAAK,GAAG,IAAIC,cAAJ,CAAU;AACtBC,IAAAA,aAAa,EAAE,IADO;AAEtBC,IAAAA,KAAK,EAAE,IAFe;AAGtBC,IAAAA,QAAQ,EAAEC,wBAHY;AAItBC,IAAAA,cAAc,EAAE;AAJM,GAAV,CAAd;AAOAN,EAAAA,KAAK,CAACO,OAAN,CAAcC,OAAO,CAACC,OAAR,CAAgB,eAAhB,CAAd;AACAV,EAAAA,SAAS,CAACW,OAAV,CAAkBC,QAAQ,IAAIX,KAAK,CAACO,OAAN,CAAcI,QAAd,CAA9B;;AAEA,MAAI;AACF,UAAMC,QAAQ,GAAG,MAAM,IAAIC,OAAJ,CAAYJ,OAAO,IAAI;AAC5CT,MAAAA,KAAK,CAACF,GAAN,CAAUc,QAAQ,IAAI;AACpB,YAAIA,QAAJ,EAAc;AACZH,UAAAA,OAAO,CAACG,QAAD,CAAP;AACD,SAFD,MAEO;AACLH,UAAAA,OAAO;AACR;AACF,OAND;AAOD,KARsB,CAAvB;AASA,UAAM,wCAAsB;AAC1BK,MAAAA,MAAM,EAAE,CAACF;AADiB,KAAtB,CAAN;AAGD,GAbD,CAaE,OAAOG,GAAP,EAAY;AACZC,IAAAA,OAAO,CAACC,KAAR,CAAcF,GAAd;AACAG,IAAAA,OAAO,CAACC,IAAR,CAAa,CAAb;AACD;AACF,CA5BD;;eA6BerB,G',
          sourcesContent: [
            "import Mocha from 'mocha';\r\nimport { submitExecutionResult } from '@fault/messages';\r\nimport { IPCReporter } from './recordTests.ts'\r\nconst run = async testPaths => {\r\n  const mocha = new Mocha({\r\n    allowUncaught: true,\r\n    color: true,\r\n    reporter: IPCReporter,\r\n    fullStackTrace: true,\r\n  } as any);\r\n\r\n  mocha.addFile(require.resolve('./recordTests'));\r\n  testPaths.forEach(testPath => mocha.addFile(testPath));\r\n\r\n  try {\r\n    const failures = await new Promise(resolve => {\r\n      mocha.run(failures => {\r\n        if (failures) {\r\n          resolve(failures);\r\n        } else {\r\n          resolve();\r\n        }\r\n      });\r\n    });\r\n    await submitExecutionResult({\r\n      passed: !failures,\r\n    });\r\n  } catch (err) {\r\n    console.error(err);\r\n    process.exit(1);\r\n  }\r\n};\r\nexport default run;\r\n",
          ],
          file: 'index.js',
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: '81d139a3247bff2f983b757333ece0c27e9a579a',
      },
      'packages\\@fault/messages\\lib\\index.js': {
        path: 'packages\\@fault/messages\\lib\\index.js',
        statementMap: {
          '0': {
            start: {
              line: 3,
              column: 0,
            },
            end: {
              line: 5,
              column: 3,
            },
          },
          '1': {
            start: {
              line: 6,
              column: 0,
            },
            end: {
              line: 6,
              column: 98,
            },
          },
          '2': {
            start: {
              line: 8,
              column: 12,
            },
            end: {
              line: 8,
              column: 70,
            },
          },
          '3': {
            start: {
              line: 10,
              column: 12,
            },
            end: {
              line: 10,
              column: 27,
            },
          },
          '4': {
            start: {
              line: 12,
              column: 40,
            },
            end: {
              line: 12,
              column: 470,
            },
          },
          '5': {
            start: {
              line: 12,
              column: 69,
            },
            end: {
              line: 12,
              column: 80,
            },
          },
          '6': {
            start: {
              line: 12,
              column: 103,
            },
            end: {
              line: 12,
              column: 105,
            },
          },
          '7': {
            start: {
              line: 12,
              column: 107,
            },
            end: {
              line: 12,
              column: 431,
            },
          },
          '8': {
            start: {
              line: 12,
              column: 126,
            },
            end: {
              line: 12,
              column: 429,
            },
          },
          '9': {
            start: {
              line: 12,
              column: 149,
            },
            end: {
              line: 12,
              column: 427,
            },
          },
          '10': {
            start: {
              line: 12,
              column: 214,
            },
            end: {
              line: 12,
              column: 319,
            },
          },
          '11': {
            start: {
              line: 12,
              column: 321,
            },
            end: {
              line: 12,
              column: 425,
            },
          },
          '12': {
            start: {
              line: 12,
              column: 349,
            },
            end: {
              line: 12,
              column: 390,
            },
          },
          '13': {
            start: {
              line: 12,
              column: 400,
            },
            end: {
              line: 12,
              column: 423,
            },
          },
          '14': {
            start: {
              line: 12,
              column: 432,
            },
            end: {
              line: 12,
              column: 453,
            },
          },
          '15': {
            start: {
              line: 12,
              column: 454,
            },
            end: {
              line: 12,
              column: 468,
            },
          },
          '16': {
            start: {
              line: 14,
              column: 20,
            },
            end: {
              line: 14,
              column: 68,
            },
          },
          '17': {
            start: {
              line: 16,
              column: 30,
            },
            end: {
              line: 21,
              column: 1,
            },
          },
          '18': {
            start: {
              line: 17,
              column: 17,
            },
            end: {
              line: 19,
              column: 3,
            },
          },
          '19': {
            start: {
              line: 20,
              column: 2,
            },
            end: {
              line: 20,
              column: 29,
            },
          },
          '20': {
            start: {
              line: 23,
              column: 0,
            },
            end: {
              line: 23,
              column: 54,
            },
          },
          '21': {
            start: {
              line: 25,
              column: 25,
            },
            end: {
              line: 30,
              column: 1,
            },
          },
          '22': {
            start: {
              line: 26,
              column: 17,
            },
            end: {
              line: 28,
              column: 3,
            },
          },
          '23': {
            start: {
              line: 29,
              column: 2,
            },
            end: {
              line: 29,
              column: 29,
            },
          },
          '24': {
            start: {
              line: 32,
              column: 0,
            },
            end: {
              line: 32,
              column: 44,
            },
          },
          '25': {
            start: {
              line: 34,
              column: 30,
            },
            end: {
              line: 39,
              column: 1,
            },
          },
          '26': {
            start: {
              line: 35,
              column: 17,
            },
            end: {
              line: 37,
              column: 3,
            },
          },
          '27': {
            start: {
              line: 38,
              column: 2,
            },
            end: {
              line: 38,
              column: 29,
            },
          },
          '28': {
            start: {
              line: 41,
              column: 0,
            },
            end: {
              line: 41,
              column: 54,
            },
          },
        },
        fnMap: {
          '0': {
            name: '_interopRequireWildcard',
            decl: {
              start: {
                line: 12,
                column: 9,
              },
              end: {
                line: 12,
                column: 32,
              },
            },
            loc: {
              start: {
                line: 12,
                column: 38,
              },
              end: {
                line: 12,
                column: 472,
              },
            },
            line: 12,
          },
          '1': {
            name: '(anonymous_1)',
            decl: {
              start: {
                line: 16,
                column: 30,
              },
              end: {
                line: 16,
                column: 31,
              },
            },
            loc: {
              start: {
                line: 16,
                column: 38,
              },
              end: {
                line: 21,
                column: 1,
              },
            },
            line: 16,
          },
          '2': {
            name: '(anonymous_2)',
            decl: {
              start: {
                line: 25,
                column: 25,
              },
              end: {
                line: 25,
                column: 26,
              },
            },
            loc: {
              start: {
                line: 25,
                column: 33,
              },
              end: {
                line: 30,
                column: 1,
              },
            },
            line: 25,
          },
          '3': {
            name: '(anonymous_3)',
            decl: {
              start: {
                line: 34,
                column: 30,
              },
              end: {
                line: 34,
                column: 31,
              },
            },
            loc: {
              start: {
                line: 34,
                column: 38,
              },
              end: {
                line: 39,
                column: 1,
              },
            },
            line: 34,
          },
        },
        branchMap: {
          '0': {
            loc: {
              start: {
                line: 12,
                column: 40,
              },
              end: {
                line: 12,
                column: 470,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 12,
                  column: 40,
                },
                end: {
                  line: 12,
                  column: 470,
                },
              },
              {
                start: {
                  line: 12,
                  column: 40,
                },
                end: {
                  line: 12,
                  column: 470,
                },
              },
            ],
            line: 12,
          },
          '1': {
            loc: {
              start: {
                line: 12,
                column: 44,
              },
              end: {
                line: 12,
                column: 65,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 12,
                  column: 44,
                },
                end: {
                  line: 12,
                  column: 47,
                },
              },
              {
                start: {
                  line: 12,
                  column: 51,
                },
                end: {
                  line: 12,
                  column: 65,
                },
              },
            ],
            line: 12,
          },
          '2': {
            loc: {
              start: {
                line: 12,
                column: 107,
              },
              end: {
                line: 12,
                column: 431,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 12,
                  column: 107,
                },
                end: {
                  line: 12,
                  column: 431,
                },
              },
              {
                start: {
                  line: 12,
                  column: 107,
                },
                end: {
                  line: 12,
                  column: 431,
                },
              },
            ],
            line: 12,
          },
          '3': {
            loc: {
              start: {
                line: 12,
                column: 149,
              },
              end: {
                line: 12,
                column: 427,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 12,
                  column: 149,
                },
                end: {
                  line: 12,
                  column: 427,
                },
              },
              {
                start: {
                  line: 12,
                  column: 149,
                },
                end: {
                  line: 12,
                  column: 427,
                },
              },
            ],
            line: 12,
          },
          '4': {
            loc: {
              start: {
                line: 12,
                column: 214,
              },
              end: {
                line: 12,
                column: 319,
              },
            },
            type: 'cond-expr',
            locations: [
              {
                start: {
                  line: 12,
                  column: 273,
                },
                end: {
                  line: 12,
                  column: 314,
                },
              },
              {
                start: {
                  line: 12,
                  column: 317,
                },
                end: {
                  line: 12,
                  column: 319,
                },
              },
            ],
            line: 12,
          },
          '5': {
            loc: {
              start: {
                line: 12,
                column: 214,
              },
              end: {
                line: 12,
                column: 270,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 12,
                  column: 214,
                },
                end: {
                  line: 12,
                  column: 235,
                },
              },
              {
                start: {
                  line: 12,
                  column: 239,
                },
                end: {
                  line: 12,
                  column: 270,
                },
              },
            ],
            line: 12,
          },
          '6': {
            loc: {
              start: {
                line: 12,
                column: 321,
              },
              end: {
                line: 12,
                column: 425,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 12,
                  column: 321,
                },
                end: {
                  line: 12,
                  column: 425,
                },
              },
              {
                start: {
                  line: 12,
                  column: 321,
                },
                end: {
                  line: 12,
                  column: 425,
                },
              },
            ],
            line: 12,
          },
          '7': {
            loc: {
              start: {
                line: 12,
                column: 325,
              },
              end: {
                line: 12,
                column: 345,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 12,
                  column: 325,
                },
                end: {
                  line: 12,
                  column: 333,
                },
              },
              {
                start: {
                  line: 12,
                  column: 337,
                },
                end: {
                  line: 12,
                  column: 345,
                },
              },
            ],
            line: 12,
          },
        },
        s: {
          '0': 1,
          '1': 1,
          '2': 1,
          '3': 1,
          '4': 1,
          '5': 1,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
          '11': 0,
          '12': 0,
          '13': 0,
          '14': 0,
          '15': 0,
          '16': 1,
          '17': 1,
          '18': 0,
          '19': 0,
          '20': 1,
          '21': 1,
          '22': 0,
          '23': 0,
          '24': 1,
          '25': 1,
          '26': 0,
          '27': 0,
          '28': 1,
        },
        f: {
          '0': 1,
          '1': 0,
          '2': 0,
          '3': 0,
        },
        b: {
          '0': [1, 0],
          '1': [1, 1],
          '2': [0, 0],
          '3': [0, 0],
          '4': [0, 0],
          '5': [0, 0],
          '6': [0, 0],
          '7': [0, 0],
        },
        inputSourceMap: {
          version: 3,
          sources: ['../src/index.ts'],
          names: [
            'promiseSend',
            'process',
            'send',
            'bind',
            'submitAssertionResult',
            'data',
            'result',
            'type',
            'types',
            'ASSERTION',
            'submitTestResult',
            'TEST',
            'submitExecutionResult',
            'EXECUTION',
          ],
          mappings:
            ';;;;;;;AAAA;;AACA;;;;AAmCA,MAAMA,WAA6C,GAAG,qBACpDC,OAAO,CAACC,IAAR,CAAcC,IAAd,CAAmBF,OAAnB,CADoD,CAAtD;;AAGO,MAAMG,qBAAqB,GAAIC,IAAD,IAAyB;AAC5D,QAAMC,MAAuB,GAAG,EAC9B,GAAGD,IAD2B;AAE9BE,IAAAA,IAAI,EAAEC,KAAK,CAACC;AAFkB,GAAhC;AAKA,SAAOT,WAAW,CAAEM,MAAF,CAAlB;AACD,CAPM;;;;AASA,MAAMI,gBAAgB,GAAIL,IAAD,IAA6C;AAC3E,QAAMC,MAAkB,GAAG,EACzB,GAAGD,IADsB;AAEzBE,IAAAA,IAAI,EAAEC,KAAK,CAACG;AAFa,GAA3B;AAKA,SAAOX,WAAW,CAAEM,MAAF,CAAlB;AACD,CAPM;;;;AASA,MAAMM,qBAAqB,GAAIP,IAAD,IAAyB;AAC5D,QAAMC,MAAuB,GAAG,EAC9B,GAAGD,IAD2B;AAE9BE,IAAAA,IAAI,EAAEC,KAAK,CAACK;AAFkB,GAAhC;AAKA,SAAOb,WAAW,CAAEM,MAAF,CAAlB;AACD,CAPM',
          sourcesContent: [
            "import * as types from '@fault/addon-message-types';\r\nimport { promisify } from 'util';\r\ninterface TypeHolder<T> {\r\n  type: T;\r\n}\r\nexport interface AssertionData {\r\n  passed: boolean;\r\n  coverage: any;\r\n}\r\nexport type AssertionResult = AssertionData & TypeHolder<typeof types.ASSERTION>;\r\n\r\nexport interface TestData {\r\n  fullTitle: any;\r\n  hash: string;\r\n  duration: number;\r\n  file: string;\r\n  coverage: any;\r\n}\r\n\r\nexport type PassingTestData = {\r\n  passed: true;\r\n} & TestData;\r\n\r\nexport type FailingTestData = {\r\n  passed: false;\r\n  stack: any;\r\n} & TestData;\r\n\r\nexport type TestResult = (PassingTestData | FailingTestData) &\r\n  TypeHolder<typeof types.TEST>;\r\n\r\nexport interface ExecutionData {\r\n  passed: boolean;\r\n}\r\nexport type ExecutionResult = ExecutionData & TypeHolder<typeof types.EXECUTION>;\r\n\r\nconst promiseSend: (param: any) => Promise<unknown> = promisify(\r\n  process.send!.bind(process),\r\n);\r\nexport const submitAssertionResult = (data: AssertionData) => {\r\n  const result: AssertionResult = {\r\n    ...data,\r\n    type: types.ASSERTION,\r\n  };\r\n\r\n  return promiseSend!(result);\r\n};\r\n\r\nexport const submitTestResult = (data: PassingTestData | FailingTestData) => {\r\n  const result: TestResult = {\r\n    ...data,\r\n    type: types.TEST,\r\n  };\r\n\r\n  return promiseSend!(result);\r\n};\r\n\r\nexport const submitExecutionResult = (data: ExecutionData) => {\r\n  const result: ExecutionResult = {\r\n    ...data,\r\n    type: types.EXECUTION,\r\n  };\r\n\r\n  return promiseSend!(result);\r\n};\r\n",
          ],
          file: 'index.js',
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: 'da72cdb6bcfe1fd176c077f3366501c9f974b7c5',
      },
      'packages\\@fault/addon-message-types\\lib\\index.js': {
        path: 'packages\\@fault/addon-message-types\\lib\\index.js',
        statementMap: {
          '0': {
            start: {
              line: 3,
              column: 0,
            },
            end: {
              line: 5,
              column: 3,
            },
          },
          '1': {
            start: {
              line: 6,
              column: 0,
            },
            end: {
              line: 6,
              column: 62,
            },
          },
          '2': {
            start: {
              line: 11,
              column: 18,
            },
            end: {
              line: 11,
              column: 19,
            },
          },
          '3': {
            start: {
              line: 16,
              column: 0,
            },
            end: {
              line: 16,
              column: 30,
            },
          },
          '4': {
            start: {
              line: 17,
              column: 18,
            },
            end: {
              line: 17,
              column: 19,
            },
          },
          '5': {
            start: {
              line: 22,
              column: 0,
            },
            end: {
              line: 22,
              column: 30,
            },
          },
          '6': {
            start: {
              line: 23,
              column: 13,
            },
            end: {
              line: 23,
              column: 14,
            },
          },
          '7': {
            start: {
              line: 24,
              column: 0,
            },
            end: {
              line: 24,
              column: 20,
            },
          },
        },
        fnMap: {},
        branchMap: {},
        s: {
          '0': 1,
          '1': 1,
          '2': 1,
          '3': 1,
          '4': 1,
          '5': 1,
          '6': 1,
          '7': 1,
        },
        f: {},
        b: {},
        inputSourceMap: {
          version: 3,
          sources: ['../src/index.ts'],
          names: ['EXECUTION', 'ASSERTION', 'TEST'],
          mappings:
            ';;;;;;;AAAA;;;AAGO,MAAMA,SAAS,GAAG,CAAlB;AACP;;;;;AAGO,MAAMC,SAAS,GAAG,CAAlB;AACP;;;;;AAGO,MAAMC,IAAI,GAAG,CAAb',
          sourcesContent: [
            '/**\r\n * For when you want to notify that the test worker has finised\r\n */\r\nexport const EXECUTION = 0;\r\n/**\r\n * For recording assertion results\r\n */\r\nexport const ASSERTION = 1;\r\n/**\r\n * For recording test results\r\n */\r\nexport const TEST = 2;\r\n',
          ],
          file: 'index.js',
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: 'b1892b75135c9d7a4f1cdeb7655f15fc00ecef46',
      },
      'packages\\@fault/tester-mocha\\lib\\recordTests.js': {
        path: 'packages\\@fault/tester-mocha\\lib\\recordTests.js',
        statementMap: {
          '0': {
            start: {
              line: 3,
              column: 0,
            },
            end: {
              line: 5,
              column: 3,
            },
          },
          '1': {
            start: {
              line: 6,
              column: 0,
            },
            end: {
              line: 6,
              column: 29,
            },
          },
          '2': {
            start: {
              line: 8,
              column: 19,
            },
            end: {
              line: 8,
              column: 43,
            },
          },
          '3': {
            start: {
              line: 10,
              column: 14,
            },
            end: {
              line: 10,
              column: 31,
            },
          },
          '4': {
            start: {
              line: 12,
              column: 22,
            },
            end: {
              line: 12,
              column: 49,
            },
          },
          '5': {
            start: {
              line: 14,
              column: 10,
            },
            end: {
              line: 14,
              column: 26,
            },
          },
          '6': {
            start: {
              line: 16,
              column: 13,
            },
            end: {
              line: 16,
              column: 53,
            },
          },
          '7': {
            start: {
              line: 18,
              column: 39,
            },
            end: {
              line: 18,
              column: 93,
            },
          },
          '8': {
            start: {
              line: 24,
              column: 4,
            },
            end: {
              line: 24,
              column: 35,
            },
          },
          '9': {
            start: {
              line: 25,
              column: 21,
            },
            end: {
              line: 25,
              column: 35,
            },
          },
          '10': {
            start: {
              line: 26,
              column: 25,
            },
            end: {
              line: 26,
              column: 34,
            },
          },
          '11': {
            start: {
              line: 27,
              column: 8,
            },
            end: {
              line: 27,
              column: 9,
            },
          },
          '12': {
            start: {
              line: 29,
              column: 25,
            },
            end: {
              line: 45,
              column: 1,
            },
          },
          '13': {
            start: {
              line: 30,
              column: 2,
            },
            end: {
              line: 44,
              column: 4,
            },
          },
          '14': {
            start: {
              line: 31,
              column: 4,
            },
            end: {
              line: 31,
              column: 123,
            },
          },
          '15': {
            start: {
              line: 32,
              column: 21,
            },
            end: {
              line: 32,
              column: 100,
            },
          },
          '16': {
            start: {
              line: 33,
              column: 17,
            },
            end: {
              line: 33,
              column: 83,
            },
          },
          '17': {
            start: {
              line: 34,
              column: 21,
            },
            end: {
              line: 34,
              column: 41,
            },
          },
          '18': {
            start: {
              line: 35,
              column: 17,
            },
            end: {
              line: 35,
              column: 26,
            },
          },
          '19': {
            start: {
              line: 36,
              column: 22,
            },
            end: {
              line: 36,
              column: 38,
            },
          },
          '20': {
            start: {
              line: 37,
              column: 4,
            },
            end: {
              line: 43,
              column: 18,
            },
          },
          '21': {
            start: {
              line: 49,
              column: 4,
            },
            end: {
              line: 60,
              column: 7,
            },
          },
          '22': {
            start: {
              line: 50,
              column: 6,
            },
            end: {
              line: 52,
              column: 9,
            },
          },
          '23': {
            start: {
              line: 54,
              column: 6,
            },
            end: {
              line: 57,
              column: 9,
            },
          },
          '24': {
            start: {
              line: 59,
              column: 6,
            },
            end: {
              line: 59,
              column: 84,
            },
          },
          '25': {
            start: {
              line: 65,
              column: 0,
            },
            end: {
              line: 65,
              column: 34,
            },
          },
        },
        fnMap: {
          '0': {
            name: '_interopRequireDefault',
            decl: {
              start: {
                line: 18,
                column: 9,
              },
              end: {
                line: 18,
                column: 31,
              },
            },
            loc: {
              start: {
                line: 18,
                column: 37,
              },
              end: {
                line: 18,
                column: 95,
              },
            },
            line: 18,
          },
          '1': {
            name: '(anonymous_1)',
            decl: {
              start: {
                line: 29,
                column: 25,
              },
              end: {
                line: 29,
                column: 26,
              },
            },
            loc: {
              start: {
                line: 29,
                column: 41,
              },
              end: {
                line: 45,
                column: 1,
              },
            },
            line: 29,
          },
          '2': {
            name: '(anonymous_2)',
            decl: {
              start: {
                line: 30,
                column: 9,
              },
              end: {
                line: 30,
                column: 10,
              },
            },
            loc: {
              start: {
                line: 30,
                column: 30,
              },
              end: {
                line: 44,
                column: 3,
              },
            },
            line: 30,
          },
          '3': {
            name: '(anonymous_3)',
            decl: {
              start: {
                line: 48,
                column: 2,
              },
              end: {
                line: 48,
                column: 3,
              },
            },
            loc: {
              start: {
                line: 48,
                column: 22,
              },
              end: {
                line: 61,
                column: 3,
              },
            },
            line: 48,
          },
          '4': {
            name: '(anonymous_4)',
            decl: {
              start: {
                line: 49,
                column: 48,
              },
              end: {
                line: 49,
                column: 49,
              },
            },
            loc: {
              start: {
                line: 49,
                column: 66,
              },
              end: {
                line: 53,
                column: 5,
              },
            },
            line: 49,
          },
          '5': {
            name: '(anonymous_5)',
            decl: {
              start: {
                line: 53,
                column: 45,
              },
              end: {
                line: 53,
                column: 46,
              },
            },
            loc: {
              start: {
                line: 53,
                column: 76,
              },
              end: {
                line: 58,
                column: 5,
              },
            },
            line: 53,
          },
          '6': {
            name: '(anonymous_6)',
            decl: {
              start: {
                line: 58,
                column: 30,
              },
              end: {
                line: 58,
                column: 31,
              },
            },
            loc: {
              start: {
                line: 58,
                column: 36,
              },
              end: {
                line: 60,
                column: 5,
              },
            },
            line: 58,
          },
        },
        branchMap: {
          '0': {
            loc: {
              start: {
                line: 18,
                column: 46,
              },
              end: {
                line: 18,
                column: 92,
              },
            },
            type: 'cond-expr',
            locations: [
              {
                start: {
                  line: 18,
                  column: 70,
                },
                end: {
                  line: 18,
                  column: 73,
                },
              },
              {
                start: {
                  line: 18,
                  column: 76,
                },
                end: {
                  line: 18,
                  column: 92,
                },
              },
            ],
            line: 18,
          },
          '1': {
            loc: {
              start: {
                line: 18,
                column: 46,
              },
              end: {
                line: 18,
                column: 67,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 18,
                  column: 46,
                },
                end: {
                  line: 18,
                  column: 49,
                },
              },
              {
                start: {
                  line: 18,
                  column: 53,
                },
                end: {
                  line: 18,
                  column: 67,
                },
              },
            ],
            line: 18,
          },
        },
        s: {
          '0': 1,
          '1': 1,
          '2': 1,
          '3': 1,
          '4': 1,
          '5': 1,
          '6': 1,
          '7': 1,
          '8': 1,
          '9': 1,
          '10': 1,
          '11': 1,
          '12': 1,
          '13': 2,
          '14': 1,
          '15': 0,
          '16': 0,
          '17': 0,
          '18': 0,
          '19': 0,
          '20': 0,
          '21': 1,
          '22': 0,
          '23': 0,
          '24': 2,
          '25': 1,
        },
        f: {
          '0': 1,
          '1': 2,
          '2': 1,
          '3': 1,
          '4': 0,
          '5': 0,
          '6': 2,
        },
        b: {
          '0': [0, 1],
          '1': [1, 1],
        },
        inputSourceMap: {
          version: 3,
          sources: ['../src/recordTests.ts'],
          names: [
            'EVENT_TEST_FAIL',
            'EVENT_TEST_PASS',
            'EVENT_SUITE_BEGIN',
            'Mocha',
            'Runner',
            'constants',
            'COVERAGE_KEY',
            'beforeTestCoverage',
            'undefined',
            'i',
            'commonTestHandle',
            'submitHandle',
            'test',
            'err',
            'toString',
            'JSON',
            'stringify',
            'global',
            'coverage',
            'hash',
            'update',
            'body',
            'digest',
            'duration',
            'file',
            'fullTitle',
            'IPCReporter',
            'constructor',
            'runner',
            'on',
            'testData',
            'passed',
            'stack',
          ],
          mappings:
            ';;;;;;;AAAA;;AACA;;AACA;;AACA;;AAEA;;;;AACA,MAAM;AACJA,EAAAA,eADI;AAEJC,EAAAA,eAFI;AAGJC,EAAAA;AAHI,IAIDC,eAAMC,MAAP,CAAsBC,SAJ1B;AAKA,MAAMC,YAAY,GAAG,cAArB;AACA,IAAIC,kBAAwC,GAAGC,SAA/C;AAEA,IAAIC,CAAC,GAAE,CAAP;;AACA,MAAMC,gBAAgB,GAAGC,YAAY,IAAI;AACvC,SAAO,OAAOC,IAAP,EAAaC,GAAb,KAAqB;AAC1B,UAAM,mBAAU,OAAO,CAACJ,CAAC,EAAF,EAAMK,QAAN,EAAP,GAA0B,MAApC,EAA4CC,IAAI,CAACC,SAAL,CAAeC,MAAM,CAACX,YAAD,CAArB,EAAqCE,SAArC,EAAgD,CAAhD,CAA5C,EAAgG,MAAhG,CAAN;AACA,UAAMU,QAAQ,GAAG,sCAAiBX,kBAAjB,EAAqCU,MAAM,CAACX,YAAD,CAA3C,CAAjB;AACA,UAAMa,IAAI,GAAG,wBAAW,MAAX,EACVC,MADU,CACHR,IAAI,CAAES,IADH,EAEVC,MAFU,CAEH,QAFG,CAAb;AAGA,UAAMC,QAAQ,GAAGX,IAAI,CAACW,QAAL,GAAiB,IAAlC;AACA,UAAMC,IAAI,GAAGZ,IAAI,CAACY,IAAlB;AACA,UAAMC,SAAS,GAAGb,IAAI,CAACa,SAAL,EAAlB;AACA,UAAMd,YAAY,CAAC;AAAEQ,MAAAA,IAAF;AAAQI,MAAAA,QAAR;AAAkBC,MAAAA,IAAlB;AAAwBC,MAAAA,SAAxB;AAAmCP,MAAAA;AAAnC,KAAD,EAAgDN,IAAhD,EAAsDC,GAAtD,CAAlB;AACD,GAVD;AAWD,CAZD;;AAcO,MAAMa,WAAN,CAAkB;AACvBC,EAAAA,WAAW,CAACC,MAAD,EAAS;AAClBA,IAAAA,MAAM,CACHC,EADH,CAEI5B,eAFJ,EAGIS,gBAAgB,CAAC,MAAMoB,QAAN,IAAkB;AACjC,YAAM,mCAAiB,EACrB,GAAGA,QADkB;AAErBC,QAAAA,MAAM,EAAE;AAFa,OAAjB,CAAN;AAID,KALe,CAHpB,EAUGF,EAVH,CAWI7B,eAXJ,EAYIU,gBAAgB,CAAC,OAAOoB,QAAP,EAAiBlB,IAAjB,EAAuBC,GAAvB,KAA+B;AAC9C,YAAM,mCAAiB,EACrB,GAAGiB,QADkB;AAErBC,QAAAA,MAAM,EAAE,KAFa;AAGrBC,QAAAA,KAAK,EAAEnB,GAAG,CAACmB;AAHU,OAAjB,CAAN;AAKD,KANe,CAZpB,EAoBGH,EApBH,CAoBM3B,iBApBN,EAoByB,MAAM;AAC3BK,MAAAA,kBAAkB,GAAG,mCAAcU,MAAM,CAACX,YAAD,CAApB,CAArB;AACD,KAtBH;AAuBD;;AAzBsB',
          sourcesContent: [
            "import { submitTestResult } from '@fault/messages';\r\nimport { createHash } from 'crypto';\r\nimport { subtractCoverage, Coverage } from '@fault/istanbul-util';\r\nimport { writeFile } from 'fs/promises';\r\nimport { cloneCoverage } from '@fault/istanbul-util';\r\nimport Mocha from 'mocha';\r\nconst {\r\n  EVENT_TEST_FAIL,\r\n  EVENT_TEST_PASS,\r\n  EVENT_SUITE_BEGIN,\r\n} = (Mocha.Runner as any).constants;\r\nconst COVERAGE_KEY = '__coverage__';\r\nlet beforeTestCoverage: Coverage | undefined = undefined;\r\n\r\nlet i =0;\r\nconst commonTestHandle = submitHandle => {\r\n  return async (test, err) => {\r\n    await writeFile('./' + (i++).toString() + '.txt', JSON.stringify(global[COVERAGE_KEY], undefined, 2), 'utf8');\r\n    const coverage = subtractCoverage(beforeTestCoverage, global[COVERAGE_KEY]);\r\n    const hash = createHash('sha1')\r\n      .update(test!.body)\r\n      .digest('base64');\r\n    const duration = test.duration! * 1000;\r\n    const file = test.file!;\r\n    const fullTitle = test.fullTitle();\r\n    await submitHandle({ hash, duration, file, fullTitle, coverage }, test, err);\r\n  };\r\n};\r\n\r\nexport class IPCReporter {\r\n  constructor(runner) {\r\n    runner\r\n      .on(\r\n        EVENT_TEST_PASS,\r\n        commonTestHandle(async testData => {\r\n          await submitTestResult({\r\n            ...testData,\r\n            passed: true,\r\n          });\r\n        }),\r\n      )\r\n      .on(\r\n        EVENT_TEST_FAIL,\r\n        commonTestHandle(async (testData, test, err) => {\r\n          await submitTestResult({\r\n            ...testData,\r\n            passed: false,\r\n            stack: err.stack,\r\n          });\r\n        }),\r\n      )\r\n      .on(EVENT_SUITE_BEGIN, () => {\r\n        beforeTestCoverage = cloneCoverage(global[COVERAGE_KEY]);\r\n      });\r\n  }\r\n}\r\n",
          ],
          file: 'recordTests.js',
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: 'e22707b82fd6b54a27aab2453836e50fe422bccf',
      },
      'packages\\@fault/istanbul-util\\lib\\index.js': {
        path: 'packages\\@fault/istanbul-util\\lib\\index.js',
        statementMap: {
          '0': {
            start: {
              line: 3,
              column: 0,
            },
            end: {
              line: 5,
              column: 3,
            },
          },
          '1': {
            start: {
              line: 6,
              column: 0,
            },
            end: {
              line: 6,
              column: 126,
            },
          },
          '2': {
            start: {
              line: 8,
              column: 22,
            },
            end: {
              line: 22,
              column: 1,
            },
          },
          '3': {
            start: {
              line: 9,
              column: 2,
            },
            end: {
              line: 21,
              column: 3,
            },
          },
          '4': {
            start: {
              line: 10,
              column: 4,
            },
            end: {
              line: 10,
              column: 39,
            },
          },
          '5': {
            start: {
              line: 11,
              column: 9,
            },
            end: {
              line: 21,
              column: 3,
            },
          },
          '6': {
            start: {
              line: 12,
              column: 16,
            },
            end: {
              line: 12,
              column: 18,
            },
          },
          '7': {
            start: {
              line: 14,
              column: 4,
            },
            end: {
              line: 16,
              column: 5,
            },
          },
          '8': {
            start: {
              line: 15,
              column: 6,
            },
            end: {
              line: 15,
              column: 38,
            },
          },
          '9': {
            start: {
              line: 18,
              column: 4,
            },
            end: {
              line: 18,
              column: 15,
            },
          },
          '10': {
            start: {
              line: 20,
              column: 4,
            },
            end: {
              line: 20,
              column: 20,
            },
          },
          '11': {
            start: {
              line: 24,
              column: 0,
            },
            end: {
              line: 24,
              column: 38,
            },
          },
          '12': {
            start: {
              line: 26,
              column: 34,
            },
            end: {
              line: 34,
              column: 1,
            },
          },
          '13': {
            start: {
              line: 27,
              column: 15,
            },
            end: {
              line: 27,
              column: 17,
            },
          },
          '14': {
            start: {
              line: 29,
              column: 2,
            },
            end: {
              line: 31,
              column: 3,
            },
          },
          '15': {
            start: {
              line: 30,
              column: 4,
            },
            end: {
              line: 30,
              column: 41,
            },
          },
          '16': {
            start: {
              line: 33,
              column: 2,
            },
            end: {
              line: 33,
              column: 14,
            },
          },
          '17': {
            start: {
              line: 36,
              column: 0,
            },
            end: {
              line: 36,
              column: 62,
            },
          },
          '18': {
            start: {
              line: 38,
              column: 30,
            },
            end: {
              line: 54,
              column: 1,
            },
          },
          '19': {
            start: {
              line: 39,
              column: 15,
            },
            end: {
              line: 39,
              column: 17,
            },
          },
          '20': {
            start: {
              line: 41,
              column: 2,
            },
            end: {
              line: 51,
              column: 3,
            },
          },
          '21': {
            start: {
              line: 42,
              column: 25,
            },
            end: {
              line: 42,
              column: 36,
            },
          },
          '22': {
            start: {
              line: 43,
              column: 24,
            },
            end: {
              line: 43,
              column: 34,
            },
          },
          '23': {
            start: {
              line: 44,
              column: 19,
            },
            end: {
              line: 44,
              column: 49,
            },
          },
          '24': {
            start: {
              line: 46,
              column: 4,
            },
            end: {
              line: 48,
              column: 5,
            },
          },
          '25': {
            start: {
              line: 46,
              column: 17,
            },
            end: {
              line: 46,
              column: 18,
            },
          },
          '26': {
            start: {
              line: 47,
              column: 6,
            },
            end: {
              line: 47,
              column: 51,
            },
          },
          '27': {
            start: {
              line: 50,
              column: 4,
            },
            end: {
              line: 50,
              column: 23,
            },
          },
          '28': {
            start: {
              line: 53,
              column: 2,
            },
            end: {
              line: 53,
              column: 14,
            },
          },
          '29': {
            start: {
              line: 56,
              column: 0,
            },
            end: {
              line: 56,
              column: 54,
            },
          },
          '30': {
            start: {
              line: 58,
              column: 16,
            },
            end: {
              line: 58,
              column: 36,
            },
          },
          '31': {
            start: {
              line: 58,
              column: 25,
            },
            end: {
              line: 58,
              column: 36,
            },
          },
          '32': {
            start: {
              line: 60,
              column: 25,
            },
            end: {
              line: 94,
              column: 1,
            },
          },
          '33': {
            start: {
              line: 61,
              column: 2,
            },
            end: {
              line: 63,
              column: 3,
            },
          },
          '34': {
            start: {
              line: 62,
              column: 4,
            },
            end: {
              line: 62,
              column: 32,
            },
          },
          '35': {
            start: {
              line: 65,
              column: 15,
            },
            end: {
              line: 65,
              column: 17,
            },
          },
          '36': {
            start: {
              line: 67,
              column: 2,
            },
            end: {
              line: 91,
              column: 3,
            },
          },
          '37': {
            start: {
              line: 68,
              column: 31,
            },
            end: {
              line: 68,
              column: 47,
            },
          },
          '38': {
            start: {
              line: 70,
              column: 4,
            },
            end: {
              line: 73,
              column: 5,
            },
          },
          '39': {
            start: {
              line: 71,
              column: 6,
            },
            end: {
              line: 71,
              column: 51,
            },
          },
          '40': {
            start: {
              line: 72,
              column: 6,
            },
            end: {
              line: 72,
              column: 15,
            },
          },
          '41': {
            start: {
              line: 75,
              column: 21,
            },
            end: {
              line: 85,
              column: 5,
            },
          },
          '42': {
            start: {
              line: 86,
              column: 23,
            },
            end: {
              line: 86,
              column: 165,
            },
          },
          '43': {
            start: {
              line: 86,
              column: 147,
            },
            end: {
              line: 86,
              column: 164,
            },
          },
          '44': {
            start: {
              line: 88,
              column: 4,
            },
            end: {
              line: 90,
              column: 5,
            },
          },
          '45': {
            start: {
              line: 89,
              column: 6,
            },
            end: {
              line: 89,
              column: 32,
            },
          },
          '46': {
            start: {
              line: 93,
              column: 2,
            },
            end: {
              line: 93,
              column: 14,
            },
          },
          '47': {
            start: {
              line: 96,
              column: 0,
            },
            end: {
              line: 96,
              column: 44,
            },
          },
        },
        fnMap: {
          '0': {
            name: '(anonymous_0)',
            decl: {
              start: {
                line: 8,
                column: 22,
              },
              end: {
                line: 8,
                column: 23,
              },
            },
            loc: {
              start: {
                line: 8,
                column: 34,
              },
              end: {
                line: 22,
                column: 1,
              },
            },
            line: 8,
          },
          '1': {
            name: '(anonymous_1)',
            decl: {
              start: {
                line: 26,
                column: 34,
              },
              end: {
                line: 26,
                column: 35,
              },
            },
            loc: {
              start: {
                line: 26,
                column: 53,
              },
              end: {
                line: 34,
                column: 1,
              },
            },
            line: 26,
          },
          '2': {
            name: '(anonymous_2)',
            decl: {
              start: {
                line: 38,
                column: 30,
              },
              end: {
                line: 38,
                column: 31,
              },
            },
            loc: {
              start: {
                line: 38,
                column: 49,
              },
              end: {
                line: 54,
                column: 1,
              },
            },
            line: 38,
          },
          '3': {
            name: '(anonymous_3)',
            decl: {
              start: {
                line: 58,
                column: 16,
              },
              end: {
                line: 58,
                column: 17,
              },
            },
            loc: {
              start: {
                line: 58,
                column: 25,
              },
              end: {
                line: 58,
                column: 36,
              },
            },
            line: 58,
          },
          '4': {
            name: '(anonymous_4)',
            decl: {
              start: {
                line: 60,
                column: 25,
              },
              end: {
                line: 60,
                column: 26,
              },
            },
            loc: {
              start: {
                line: 60,
                column: 44,
              },
              end: {
                line: 94,
                column: 1,
              },
            },
            line: 60,
          },
          '5': {
            name: '(anonymous_5)',
            decl: {
              start: {
                line: 86,
                column: 140,
              },
              end: {
                line: 86,
                column: 141,
              },
            },
            loc: {
              start: {
                line: 86,
                column: 147,
              },
              end: {
                line: 86,
                column: 164,
              },
            },
            line: 86,
          },
        },
        branchMap: {
          '0': {
            loc: {
              start: {
                line: 9,
                column: 2,
              },
              end: {
                line: 21,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 9,
                  column: 2,
                },
                end: {
                  line: 21,
                  column: 3,
                },
              },
              {
                start: {
                  line: 9,
                  column: 2,
                },
                end: {
                  line: 21,
                  column: 3,
                },
              },
            ],
            line: 9,
          },
          '1': {
            loc: {
              start: {
                line: 11,
                column: 9,
              },
              end: {
                line: 21,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 11,
                  column: 9,
                },
                end: {
                  line: 21,
                  column: 3,
                },
              },
              {
                start: {
                  line: 11,
                  column: 9,
                },
                end: {
                  line: 21,
                  column: 3,
                },
              },
            ],
            line: 11,
          },
          '2': {
            loc: {
              start: {
                line: 61,
                column: 2,
              },
              end: {
                line: 63,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 61,
                  column: 2,
                },
                end: {
                  line: 63,
                  column: 3,
                },
              },
              {
                start: {
                  line: 61,
                  column: 2,
                },
                end: {
                  line: 63,
                  column: 3,
                },
              },
            ],
            line: 61,
          },
          '3': {
            loc: {
              start: {
                line: 70,
                column: 4,
              },
              end: {
                line: 73,
                column: 5,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 70,
                  column: 4,
                },
                end: {
                  line: 73,
                  column: 5,
                },
              },
              {
                start: {
                  line: 70,
                  column: 4,
                },
                end: {
                  line: 73,
                  column: 5,
                },
              },
            ],
            line: 70,
          },
          '4': {
            loc: {
              start: {
                line: 86,
                column: 23,
              },
              end: {
                line: 86,
                column: 165,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 86,
                  column: 23,
                },
                end: {
                  line: 86,
                  column: 62,
                },
              },
              {
                start: {
                  line: 86,
                  column: 66,
                },
                end: {
                  line: 86,
                  column: 105,
                },
              },
              {
                start: {
                  line: 86,
                  column: 109,
                },
                end: {
                  line: 86,
                  column: 165,
                },
              },
            ],
            line: 86,
          },
          '5': {
            loc: {
              start: {
                line: 88,
                column: 4,
              },
              end: {
                line: 90,
                column: 5,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 88,
                  column: 4,
                },
                end: {
                  line: 90,
                  column: 5,
                },
              },
              {
                start: {
                  line: 88,
                  column: 4,
                },
                end: {
                  line: 90,
                  column: 5,
                },
              },
            ],
            line: 88,
          },
        },
        s: {
          '0': 1,
          '1': 1,
          '2': 1,
          '3': 8884,
          '4': 236,
          '5': 8648,
          '6': 3208,
          '7': 3208,
          '8': 8148,
          '9': 3208,
          '10': 5440,
          '11': 1,
          '12': 1,
          '13': 0,
          '14': 0,
          '15': 0,
          '16': 0,
          '17': 1,
          '18': 1,
          '19': 0,
          '20': 0,
          '21': 0,
          '22': 0,
          '23': 0,
          '24': 0,
          '25': 0,
          '26': 0,
          '27': 0,
          '28': 0,
          '29': 1,
          '30': 1,
          '31': 0,
          '32': 1,
          '33': 0,
          '34': 0,
          '35': 0,
          '36': 0,
          '37': 0,
          '38': 0,
          '39': 0,
          '40': 0,
          '41': 0,
          '42': 0,
          '43': 0,
          '44': 0,
          '45': 0,
          '46': 0,
          '47': 1,
        },
        f: {
          '0': 8884,
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
        },
        b: {
          '0': [236, 8648],
          '1': [3208, 5440],
          '2': [0, 0],
          '3': [0, 0],
          '4': [0, 0, 0],
          '5': [0, 0],
        },
        inputSourceMap: {
          version: 3,
          sources: ['../src/index.ts'],
          names: [
            'cloneCoverage',
            'coverage',
            'Array',
            'isArray',
            'map',
            'obj',
            'key',
            'value',
            'Object',
            'entries',
            'diffExpressionObjectCount',
            'before',
            'total',
            'diff',
            'keys',
            'diffBranchObjectCount',
            'beforeBranch',
            'totalBranch',
            'branch',
            'length',
            'i',
            'notZero',
            'subtractCoverage',
            'undefined',
            'filePath',
            'fileCoverage',
            'beforeFileCoverage',
            'fileDiff',
            'path',
            'statementMap',
            'fnMap',
            'branchMap',
            's',
            'f',
            'b',
            '_coverageSchema',
            'hash',
            'hasChanged',
            'values',
            'some',
            'arr',
          ],
          mappings:
            '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',
          sourcesContent: [
            "export const cloneCoverage = coverage => {\r\n  if (Array.isArray(coverage)) {\r\n    return coverage.map(cloneCoverage);\r\n  } else if (typeof coverage === 'object') {\r\n    const obj = {};\r\n    for (const [key, value] of Object.entries(coverage)) {\r\n      obj[key] = cloneCoverage(value);\r\n    }\r\n    return obj;\r\n  } else {\r\n    return coverage;\r\n  }\r\n};\r\n\r\nexport const diffExpressionObjectCount = (before, total) => {\r\n  const diff = {};\r\n  for (const key of Object.keys(before)) {\r\n    diff[key] = total[key] - before[key];\r\n  }\r\n  return diff;\r\n};\r\n\r\nexport interface BCoverage {\r\n  [s: string]: number[];\r\n}\r\n\r\nexport const diffBranchObjectCount = (before: BCoverage, total: BCoverage) => {\r\n  const diff: BCoverage = {};\r\n\r\n  for (const key of Object.keys(before)) {\r\n    const beforeBranch = before[key];\r\n    const totalBranch = total[key];\r\n\r\n    const branch = new Array(beforeBranch.length);\r\n    for (let i = 0; i < branch.length; i++) {\r\n      branch[i] = totalBranch[i] - beforeBranch[i];\r\n    }\r\n    diff[key] = branch;\r\n  }\r\n\r\n  return diff;\r\n};\r\n\r\nconst notZero = value => value !== 0;\r\n\r\nexport interface FCoverage {\r\n  [s: string]: number;\r\n}\r\n\r\nexport interface SCoverage {\r\n  [s: string]: number;\r\n}\r\nexport interface ExpressionLocation {\r\n  line: number;\r\n  column: number;\r\n}\r\nexport interface ExpressionCoverage {\r\n  start: ExpressionLocation;\r\n  end: ExpressionLocation;\r\n}\r\nexport interface StatementMap {\r\n  [s: string]: ExpressionCoverage;\r\n}\r\nexport interface FunctionCoverage {\r\n  name: string;\r\n  decl: ExpressionCoverage;\r\n  loc: ExpressionCoverage;\r\n  line: number;\r\n}\r\nexport interface FunctionMap {\r\n  [s: string]: FunctionCoverage;\r\n}\r\nexport interface Coverage {\r\n  path: string;\r\n  statementMap: StatementMap;\r\n  fnMap: FunctionMap;\r\n  branchMap: any;\r\n  s: SCoverage;\r\n  f: FCoverage;\r\n  b: BCoverage;\r\n  _coverageSchema: string;\r\n  hash: string;\r\n}\r\nexport const subtractCoverage = (before: Coverage | undefined, total: Coverage) => {\r\n  if (before === undefined) {\r\n    return cloneCoverage(total);\r\n  }\r\n  const diff = {};\r\n  for (const [filePath, fileCoverage] of Object.entries(total)) {\r\n    const beforeFileCoverage = before[filePath];\r\n    if (beforeFileCoverage === undefined) {\r\n      diff[filePath] = cloneCoverage(fileCoverage);\r\n      continue;\r\n    }\r\n\r\n    const fileDiff = {\r\n      path: filePath,\r\n      statementMap: fileCoverage.statementMap,\r\n      fnMap: fileCoverage.fnMap,\r\n      branchMap: fileCoverage.branchMap,\r\n      s: diffExpressionObjectCount(beforeFileCoverage.s, fileCoverage.s),\r\n      f: diffExpressionObjectCount(beforeFileCoverage.f, fileCoverage.f),\r\n      b: diffBranchObjectCount(beforeFileCoverage.b, fileCoverage.b),\r\n      _coverageSchema: fileCoverage._coverageSchema,\r\n      hash: fileCoverage.hash,\r\n    };\r\n\r\n    const hasChanged =\r\n      Object.values(fileDiff.s).some(notZero) ||\r\n      Object.values(fileDiff.f).some(notZero) ||\r\n      Object.values(fileDiff.b).some(arr => arr.some(notZero));\r\n    if (hasChanged) {\r\n      diff[filePath] = fileDiff;\r\n    }\r\n  }\r\n  return diff;\r\n};\r\n",
          ],
          file: 'index.js',
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: '6781da20fa4d5e06be0658d5dbad75b3b8251c47',
      },
      'packages\\hook-schema\\src\\index.ts': {
        path: 'packages\\hook-schema\\src\\index.ts',
        statementMap: {
          '0': {
            start: {
              line: 54,
              column: 2,
            },
            end: {
              line: 54,
              column: 24,
            },
          },
          '1': {
            start: {
              line: 61,
              column: 2,
            },
            end: {
              line: 73,
              column: 27,
            },
          },
          '2': {
            start: {
              line: 62,
              column: 4,
            },
            end: {
              line: 71,
              column: 5,
            },
          },
          '3': {
            start: {
              line: 64,
              column: 6,
            },
            end: {
              line: 70,
              column: 7,
            },
          },
          '4': {
            start: {
              line: 65,
              column: 8,
            },
            end: {
              line: 65,
              column: 45,
            },
          },
          '5': {
            start: {
              line: 66,
              column: 13,
            },
            end: {
              line: 70,
              column: 7,
            },
          },
          '6': {
            start: {
              line: 67,
              column: 8,
            },
            end: {
              line: 67,
              column: 70,
            },
          },
          '7': {
            start: {
              line: 69,
              column: 8,
            },
            end: {
              line: 69,
              column: 85,
            },
          },
          '8': {
            start: {
              line: 72,
              column: 4,
            },
            end: {
              line: 72,
              column: 17,
            },
          },
          '9': {
            start: {
              line: 85,
              column: 28,
            },
            end: {
              line: 87,
              column: 21,
            },
          },
          '10': {
            start: {
              line: 85,
              column: 54,
            },
            end: {
              line: 85,
              column: 61,
            },
          },
          '11': {
            start: {
              line: 88,
              column: 2,
            },
            end: {
              line: 104,
              column: 3,
            },
          },
          '12': {
            start: {
              line: 89,
              column: 19,
            },
            end: {
              line: 93,
              column: 5,
            },
          },
          '13': {
            start: {
              line: 90,
              column: 6,
            },
            end: {
              line: 92,
              column: 7,
            },
          },
          '14': {
            start: {
              line: 91,
              column: 8,
            },
            end: {
              line: 91,
              column: 34,
            },
          },
          '15': {
            start: {
              line: 98,
              column: 4,
            },
            end: {
              line: 98,
              column: 25,
            },
          },
          '16': {
            start: {
              line: 100,
              column: 4,
            },
            end: {
              line: 103,
              column: 23,
            },
          },
          '17': {
            start: {
              line: 101,
              column: 6,
            },
            end: {
              line: 101,
              column: 87,
            },
          },
          '18': {
            start: {
              line: 101,
              column: 62,
            },
            end: {
              line: 101,
              column: 72,
            },
          },
          '19': {
            start: {
              line: 102,
              column: 6,
            },
            end: {
              line: 102,
              column: 20,
            },
          },
          '20': {
            start: {
              line: 112,
              column: 33,
            },
            end: {
              line: 114,
              column: 35,
            },
          },
          '21': {
            start: {
              line: 112,
              column: 71,
            },
            end: {
              line: 112,
              column: 84,
            },
          },
          '22': {
            start: {
              line: 115,
              column: 2,
            },
            end: {
              line: 134,
              column: 4,
            },
          },
          '23': {
            start: {
              line: 118,
              column: 31,
            },
            end: {
              line: 118,
              column: 51,
            },
          },
          '24': {
            start: {
              line: 119,
              column: 28,
            },
            end: {
              line: 119,
              column: 76,
            },
          },
          '25': {
            start: {
              line: 124,
              column: 31,
            },
            end: {
              line: 124,
              column: 50,
            },
          },
          '26': {
            start: {
              line: 125,
              column: 28,
            },
            end: {
              line: 125,
              column: 75,
            },
          },
          '27': {
            start: {
              line: 130,
              column: 31,
            },
            end: {
              line: 130,
              column: 47,
            },
          },
          '28': {
            start: {
              line: 131,
              column: 28,
            },
            end: {
              line: 131,
              column: 72,
            },
          },
          '29': {
            start: {
              line: 141,
              column: 2,
            },
            end: {
              line: 151,
              column: 4,
            },
          },
          '30': {
            start: {
              line: 143,
              column: 6,
            },
            end: {
              line: 147,
              column: 8,
            },
          },
          '31': {
            start: {
              line: 150,
              column: 6,
            },
            end: {
              line: 150,
              column: 66,
            },
          },
        },
        fnMap: {
          '0': {
            name: 'defaultHook',
            decl: {
              start: {
                line: 53,
                column: 16,
              },
              end: {
                line: 53,
                column: 27,
              },
            },
            loc: {
              start: {
                line: 53,
                column: 44,
              },
              end: {
                line: 55,
                column: 1,
              },
            },
            line: 53,
          },
          '1': {
            name: '(anonymous_1)',
            decl: {
              start: {
                line: 54,
                column: 9,
              },
              end: {
                line: 54,
                column: 10,
              },
            },
            loc: {
              start: {
                line: 54,
                column: 21,
              },
              end: {
                line: 54,
                column: 23,
              },
            },
            line: 54,
          },
          '2': {
            name: 'defaultHooksFromSchema',
            decl: {
              start: {
                line: 57,
                column: 16,
              },
              end: {
                line: 57,
                column: 38,
              },
            },
            loc: {
              start: {
                line: 60,
                column: 12,
              },
              end: {
                line: 74,
                column: 1,
              },
            },
            line: 60,
          },
          '3': {
            name: '(anonymous_3)',
            decl: {
              start: {
                line: 61,
                column: 39,
              },
              end: {
                line: 61,
                column: 40,
              },
            },
            loc: {
              start: {
                line: 61,
                column: 55,
              },
              end: {
                line: 73,
                column: 3,
              },
            },
            line: 61,
          },
          '4': {
            name: '(anonymous_4)',
            decl: {
              start: {
                line: 65,
                column: 22,
              },
              end: {
                line: 65,
                column: 23,
              },
            },
            loc: {
              start: {
                line: 65,
                column: 34,
              },
              end: {
                line: 65,
                column: 36,
              },
            },
            line: 65,
          },
          '5': {
            name: 'mergeHooks',
            decl: {
              start: {
                line: 81,
                column: 16,
              },
              end: {
                line: 81,
                column: 26,
              },
            },
            loc: {
              start: {
                line: 84,
                column: 12,
              },
              end: {
                line: 105,
                column: 1,
              },
            },
            line: 84,
          },
          '6': {
            name: '(anonymous_6)',
            decl: {
              start: {
                line: 85,
                column: 45,
              },
              end: {
                line: 85,
                column: 46,
              },
            },
            loc: {
              start: {
                line: 85,
                column: 54,
              },
              end: {
                line: 85,
                column: 61,
              },
            },
            line: 85,
          },
          '7': {
            name: '(anonymous_7)',
            decl: {
              start: {
                line: 89,
                column: 19,
              },
              end: {
                line: 89,
                column: 20,
              },
            },
            loc: {
              start: {
                line: 89,
                column: 40,
              },
              end: {
                line: 93,
                column: 5,
              },
            },
            line: 89,
          },
          '8': {
            name: '(anonymous_8)',
            decl: {
              start: {
                line: 100,
                column: 37,
              },
              end: {
                line: 100,
                column: 38,
              },
            },
            loc: {
              start: {
                line: 100,
                column: 54,
              },
              end: {
                line: 103,
                column: 5,
              },
            },
            line: 100,
          },
          '9': {
            name: '(anonymous_9)',
            decl: {
              start: {
                line: 101,
                column: 53,
              },
              end: {
                line: 101,
                column: 54,
              },
            },
            loc: {
              start: {
                line: 101,
                column: 62,
              },
              end: {
                line: 101,
                column: 72,
              },
            },
            line: 101,
          },
          '10': {
            name: 'mergeHookOptions',
            decl: {
              start: {
                line: 107,
                column: 16,
              },
              end: {
                line: 107,
                column: 32,
              },
            },
            loc: {
              start: {
                line: 111,
                column: 30,
              },
              end: {
                line: 135,
                column: 1,
              },
            },
            line: 111,
          },
          '11': {
            name: '(anonymous_11)',
            decl: {
              start: {
                line: 112,
                column: 56,
              },
              end: {
                line: 112,
                column: 57,
              },
            },
            loc: {
              start: {
                line: 112,
                column: 71,
              },
              end: {
                line: 112,
                column: 84,
              },
            },
            line: 112,
          },
          '12': {
            name: '(anonymous_12)',
            decl: {
              start: {
                line: 118,
                column: 16,
              },
              end: {
                line: 118,
                column: 17,
              },
            },
            loc: {
              start: {
                line: 118,
                column: 31,
              },
              end: {
                line: 118,
                column: 51,
              },
            },
            line: 118,
          },
          '13': {
            name: '(anonymous_13)',
            decl: {
              start: {
                line: 119,
                column: 13,
              },
              end: {
                line: 119,
                column: 14,
              },
            },
            loc: {
              start: {
                line: 119,
                column: 28,
              },
              end: {
                line: 119,
                column: 76,
              },
            },
            line: 119,
          },
          '14': {
            name: '(anonymous_14)',
            decl: {
              start: {
                line: 124,
                column: 16,
              },
              end: {
                line: 124,
                column: 17,
              },
            },
            loc: {
              start: {
                line: 124,
                column: 31,
              },
              end: {
                line: 124,
                column: 50,
              },
            },
            line: 124,
          },
          '15': {
            name: '(anonymous_15)',
            decl: {
              start: {
                line: 125,
                column: 13,
              },
              end: {
                line: 125,
                column: 14,
              },
            },
            loc: {
              start: {
                line: 125,
                column: 28,
              },
              end: {
                line: 125,
                column: 75,
              },
            },
            line: 125,
          },
          '16': {
            name: '(anonymous_16)',
            decl: {
              start: {
                line: 130,
                column: 16,
              },
              end: {
                line: 130,
                column: 17,
              },
            },
            loc: {
              start: {
                line: 130,
                column: 31,
              },
              end: {
                line: 130,
                column: 47,
              },
            },
            line: 130,
          },
          '17': {
            name: '(anonymous_17)',
            decl: {
              start: {
                line: 131,
                column: 13,
              },
              end: {
                line: 131,
                column: 14,
              },
            },
            loc: {
              start: {
                line: 131,
                column: 28,
              },
              end: {
                line: 131,
                column: 72,
              },
            },
            line: 131,
          },
          '18': {
            name: 'fromSchema',
            decl: {
              start: {
                line: 137,
                column: 16,
              },
              end: {
                line: 137,
                column: 26,
              },
            },
            loc: {
              start: {
                line: 140,
                column: 2,
              },
              end: {
                line: 152,
                column: 1,
              },
            },
            line: 140,
          },
          '19': {
            name: '(anonymous_19)',
            decl: {
              start: {
                line: 142,
                column: 15,
              },
              end: {
                line: 142,
                column: 16,
              },
            },
            loc: {
              start: {
                line: 142,
                column: 85,
              },
              end: {
                line: 148,
                column: 5,
              },
            },
            line: 142,
          },
          '20': {
            name: '(anonymous_20)',
            decl: {
              start: {
                line: 149,
                column: 22,
              },
              end: {
                line: 149,
                column: 23,
              },
            },
            loc: {
              start: {
                line: 150,
                column: 6,
              },
              end: {
                line: 150,
                column: 66,
              },
            },
            line: 150,
          },
        },
        branchMap: {
          '0': {
            loc: {
              start: {
                line: 59,
                column: 2,
              },
              end: {
                line: 59,
                column: 43,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 59,
                  column: 41,
                },
                end: {
                  line: 59,
                  column: 43,
                },
              },
            ],
            line: 59,
          },
          '1': {
            loc: {
              start: {
                line: 62,
                column: 4,
              },
              end: {
                line: 71,
                column: 5,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 62,
                  column: 4,
                },
                end: {
                  line: 71,
                  column: 5,
                },
              },
              {
                start: {
                  line: 62,
                  column: 4,
                },
                end: {
                  line: 71,
                  column: 5,
                },
              },
            ],
            line: 62,
          },
          '2': {
            loc: {
              start: {
                line: 64,
                column: 6,
              },
              end: {
                line: 70,
                column: 7,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 64,
                  column: 6,
                },
                end: {
                  line: 70,
                  column: 7,
                },
              },
              {
                start: {
                  line: 64,
                  column: 6,
                },
                end: {
                  line: 70,
                  column: 7,
                },
              },
            ],
            line: 64,
          },
          '3': {
            loc: {
              start: {
                line: 66,
                column: 13,
              },
              end: {
                line: 70,
                column: 7,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 66,
                  column: 13,
                },
                end: {
                  line: 70,
                  column: 7,
                },
              },
              {
                start: {
                  line: 66,
                  column: 13,
                },
                end: {
                  line: 70,
                  column: 7,
                },
              },
            ],
            line: 66,
          },
          '4': {
            loc: {
              start: {
                line: 88,
                column: 2,
              },
              end: {
                line: 104,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 88,
                  column: 2,
                },
                end: {
                  line: 104,
                  column: 3,
                },
              },
              {
                start: {
                  line: 88,
                  column: 2,
                },
                end: {
                  line: 104,
                  column: 3,
                },
              },
            ],
            line: 88,
          },
          '5': {
            loc: {
              start: {
                line: 88,
                column: 6,
              },
              end: {
                line: 88,
                column: 51,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 88,
                  column: 6,
                },
                end: {
                  line: 88,
                  column: 33,
                },
              },
              {
                start: {
                  line: 88,
                  column: 37,
                },
                end: {
                  line: 88,
                  column: 51,
                },
              },
            ],
            line: 88,
          },
          '6': {
            loc: {
              start: {
                line: 110,
                column: 2,
              },
              end: {
                line: 110,
                column: 28,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 110,
                  column: 19,
                },
                end: {
                  line: 110,
                  column: 28,
                },
              },
            ],
            line: 110,
          },
          '7': {
            loc: {
              start: {
                line: 139,
                column: 2,
              },
              end: {
                line: 139,
                column: 28,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 139,
                  column: 19,
                },
                end: {
                  line: 139,
                  column: 28,
                },
              },
            ],
            line: 139,
          },
          '8': {
            loc: {
              start: {
                line: 142,
                column: 16,
              },
              end: {
                line: 142,
                column: 52,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 142,
                  column: 50,
                },
                end: {
                  line: 142,
                  column: 52,
                },
              },
            ],
            line: 142,
          },
        },
        s: {
          '0': 0,
          '1': 7,
          '2': 16,
          '3': 16,
          '4': 8,
          '5': 8,
          '6': 4,
          '7': 4,
          '8': 16,
          '9': 0,
          '10': 0,
          '11': 0,
          '12': 0,
          '13': 0,
          '14': 0,
          '15': 0,
          '16': 0,
          '17': 0,
          '18': 0,
          '19': 0,
          '20': 0,
          '21': 0,
          '22': 0,
          '23': 0,
          '24': 0,
          '25': 0,
          '26': 0,
          '27': 0,
          '28': 0,
          '29': 1,
          '30': 1,
          '31': 0,
        },
        f: {
          '0': 0,
          '1': 0,
          '2': 7,
          '3': 16,
          '4': 4,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
          '11': 0,
          '12': 0,
          '13': 0,
          '14': 0,
          '15': 0,
          '16': 0,
          '17': 0,
          '18': 1,
          '19': 1,
          '20': 0,
        },
        b: {
          '0': [3],
          '1': [16, 0],
          '2': [8, 8],
          '3': [4, 4],
          '4': [0, 0],
          '5': [0, 0],
          '6': [0],
          '7': [1],
          '8': [1],
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: '8f47848e132b61b5b1c5cd0b35b9fda444809a2a',
      },
      'packages\\sinon-stub-functions\\src\\index.ts': {
        path: 'packages\\sinon-stub-functions\\src\\index.ts',
        statementMap: {
          '0': {
            start: {
              line: 4,
              column: 29,
            },
            end: {
              line: 18,
              column: 1,
            },
          },
          '1': {
            start: {
              line: 9,
              column: 2,
            },
            end: {
              line: 17,
              column: 4,
            },
          },
          '2': {
            start: {
              line: 12,
              column: 23,
            },
            end: {
              line: 12,
              column: 29,
            },
          },
          '3': {
            start: {
              line: 13,
              column: 6,
            },
            end: {
              line: 13,
              column: 43,
            },
          },
          '4': {
            start: {
              line: 14,
              column: 6,
            },
            end: {
              line: 14,
              column: 22,
            },
          },
        },
        fnMap: {
          '0': {
            name: '(anonymous_0)',
            decl: {
              start: {
                line: 4,
                column: 29,
              },
              end: {
                line: 4,
                column: 30,
              },
            },
            loc: {
              start: {
                line: 8,
                column: 5,
              },
              end: {
                line: 18,
                column: 1,
              },
            },
            line: 8,
          },
          '1': {
            name: '(anonymous_1)',
            decl: {
              start: {
                line: 7,
                column: 50,
              },
              end: {
                line: 7,
                column: 51,
              },
            },
            loc: {
              start: {
                line: 7,
                column: 56,
              },
              end: {
                line: 7,
                column: 58,
              },
            },
            line: 7,
          },
          '2': {
            name: '(anonymous_2)',
            decl: {
              start: {
                line: 11,
                column: 4,
              },
              end: {
                line: 11,
                column: 5,
              },
            },
            loc: {
              start: {
                line: 11,
                column: 18,
              },
              end: {
                line: 15,
                column: 5,
              },
            },
            line: 11,
          },
        },
        branchMap: {
          '0': {
            loc: {
              start: {
                line: 6,
                column: 2,
              },
              end: {
                line: 6,
                column: 37,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 6,
                  column: 32,
                },
                end: {
                  line: 6,
                  column: 37,
                },
              },
            ],
            line: 6,
          },
          '1': {
            loc: {
              start: {
                line: 7,
                column: 2,
              },
              end: {
                line: 7,
                column: 58,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 7,
                  column: 50,
                },
                end: {
                  line: 7,
                  column: 58,
                },
              },
            ],
            line: 7,
          },
        },
        s: {
          '0': 1,
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
        },
        f: {
          '0': 0,
          '1': 0,
          '2': 0,
        },
        b: {
          '0': [0],
          '1': [0],
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: 'f6bb7716fe9b6d61ba941f76fdd50e57666f9aaf',
      },
      'packages\\replace-functions\\lib\\index.js': {
        path: 'packages\\replace-functions\\lib\\index.js',
        statementMap: {
          '0': {
            start: {
              line: 3,
              column: 0,
            },
            end: {
              line: 5,
              column: 3,
            },
          },
          '1': {
            start: {
              line: 6,
              column: 0,
            },
            end: {
              line: 6,
              column: 44,
            },
          },
          '2': {
            start: {
              line: 7,
              column: 0,
            },
            end: {
              line: 7,
              column: 25,
            },
          },
          '3': {
            start: {
              line: 10,
              column: 2,
            },
            end: {
              line: 10,
              column: 71,
            },
          },
          '4': {
            start: {
              line: 14,
              column: 2,
            },
            end: {
              line: 19,
              column: 3,
            },
          },
          '5': {
            start: {
              line: 15,
              column: 4,
            },
            end: {
              line: 15,
              column: 33,
            },
          },
          '6': {
            start: {
              line: 18,
              column: 4,
            },
            end: {
              line: 18,
              column: 40,
            },
          },
          '7': {
            start: {
              line: 23,
              column: 2,
            },
            end: {
              line: 25,
              column: 3,
            },
          },
          '8': {
            start: {
              line: 24,
              column: 4,
            },
            end: {
              line: 24,
              column: 101,
            },
          },
          '9': {
            start: {
              line: 27,
              column: 2,
            },
            end: {
              line: 27,
              column: 19,
            },
          },
          '10': {
            start: {
              line: 31,
              column: 2,
            },
            end: {
              line: 33,
              column: 3,
            },
          },
          '11': {
            start: {
              line: 32,
              column: 4,
            },
            end: {
              line: 32,
              column: 106,
            },
          },
          '12': {
            start: {
              line: 35,
              column: 2,
            },
            end: {
              line: 35,
              column: 19,
            },
          },
          '13': {
            start: {
              line: 39,
              column: 30,
            },
            end: {
              line: 39,
              column: 69,
            },
          },
          '14': {
            start: {
              line: 40,
              column: 2,
            },
            end: {
              line: 49,
              column: 5,
            },
          },
          '15': {
            start: {
              line: 41,
              column: 31,
            },
            end: {
              line: 41,
              column: 55,
            },
          },
          '16': {
            start: {
              line: 42,
              column: 37,
            },
            end: {
              line: 47,
              column: 5,
            },
          },
          '17': {
            start: {
              line: 48,
              column: 4,
            },
            end: {
              line: 48,
              column: 71,
            },
          },
          '18': {
            start: {
              line: 50,
              column: 2,
            },
            end: {
              line: 50,
              column: 22,
            },
          },
          '19': {
            start: {
              line: 55,
              column: 20,
            },
            end: {
              line: 55,
              column: 48,
            },
          },
          '20': {
            start: {
              line: 57,
              column: 2,
            },
            end: {
              line: 61,
              column: 3,
            },
          },
          '21': {
            start: {
              line: 58,
              column: 4,
            },
            end: {
              line: 58,
              column: 114,
            },
          },
          '22': {
            start: {
              line: 60,
              column: 4,
            },
            end: {
              line: 60,
              column: 24,
            },
          },
          '23': {
            start: {
              line: 65,
              column: 25,
            },
            end: {
              line: 65,
              column: 58,
            },
          },
          '24': {
            start: {
              line: 67,
              column: 2,
            },
            end: {
              line: 69,
              column: 3,
            },
          },
          '25': {
            start: {
              line: 68,
              column: 4,
            },
            end: {
              line: 68,
              column: 40,
            },
          },
          '26': {
            start: {
              line: 73,
              column: 4,
            },
            end: {
              line: 79,
              column: 5,
            },
          },
          '27': {
            start: {
              line: 74,
              column: 21,
            },
            end: {
              line: 74,
              column: 54,
            },
          },
          '28': {
            start: {
              line: 75,
              column: 6,
            },
            end: {
              line: 75,
              column: 43,
            },
          },
          '29': {
            start: {
              line: 76,
              column: 6,
            },
            end: {
              line: 76,
              column: 108,
            },
          },
          '30': {
            start: {
              line: 78,
              column: 6,
            },
            end: {
              line: 78,
              column: 23,
            },
          },
          '31': {
            start: {
              line: 82,
              column: 2,
            },
            end: {
              line: 102,
              column: 3,
            },
          },
          '32': {
            start: {
              line: 83,
              column: 21,
            },
            end: {
              line: 83,
              column: 54,
            },
          },
          '33': {
            start: {
              line: 84,
              column: 4,
            },
            end: {
              line: 84,
              column: 43,
            },
          },
          '34': {
            start: {
              line: 85,
              column: 4,
            },
            end: {
              line: 85,
              column: 20,
            },
          },
          '35': {
            start: {
              line: 86,
              column: 9,
            },
            end: {
              line: 102,
              column: 3,
            },
          },
          '36': {
            start: {
              line: 87,
              column: 4,
            },
            end: {
              line: 87,
              column: 21,
            },
          },
          '37': {
            start: {
              line: 88,
              column: 9,
            },
            end: {
              line: 102,
              column: 3,
            },
          },
          '38': {
            start: {
              line: 89,
              column: 4,
            },
            end: {
              line: 89,
              column: 61,
            },
          },
          '39': {
            start: {
              line: 90,
              column: 9,
            },
            end: {
              line: 102,
              column: 3,
            },
          },
          '40': {
            start: {
              line: 91,
              column: 4,
            },
            end: {
              line: 91,
              column: 61,
            },
          },
          '41': {
            start: {
              line: 92,
              column: 9,
            },
            end: {
              line: 102,
              column: 3,
            },
          },
          '42': {
            start: {
              line: 94,
              column: 4,
            },
            end: {
              line: 94,
              column: 62,
            },
          },
          '43': {
            start: {
              line: 95,
              column: 9,
            },
            end: {
              line: 102,
              column: 3,
            },
          },
          '44': {
            start: {
              line: 96,
              column: 4,
            },
            end: {
              line: 99,
              column: 7,
            },
          },
          '45': {
            start: {
              line: 97,
              column: 22,
            },
            end: {
              line: 97,
              column: 109,
            },
          },
          '46': {
            start: {
              line: 98,
              column: 6,
            },
            end: {
              line: 98,
              column: 92,
            },
          },
          '47': {
            start: {
              line: 101,
              column: 4,
            },
            end: {
              line: 101,
              column: 21,
            },
          },
          '48': {
            start: {
              line: 106,
              column: 2,
            },
            end: {
              line: 106,
              column: 83,
            },
          },
          '49': {
            start: {
              line: 109,
              column: 15,
            },
            end: {
              line: 109,
              column: 31,
            },
          },
          '50': {
            start: {
              line: 110,
              column: 0,
            },
            end: {
              line: 110,
              column: 27,
            },
          },
        },
        fnMap: {
          '0': {
            name: 'objectWithPrototypeFrom',
            decl: {
              start: {
                line: 9,
                column: 9,
              },
              end: {
                line: 9,
                column: 32,
              },
            },
            loc: {
              start: {
                line: 9,
                column: 38,
              },
              end: {
                line: 11,
                column: 1,
              },
            },
            line: 9,
          },
          '1': {
            name: 'constructBasedOff',
            decl: {
              start: {
                line: 13,
                column: 9,
              },
              end: {
                line: 13,
                column: 26,
              },
            },
            loc: {
              start: {
                line: 13,
                column: 32,
              },
              end: {
                line: 20,
                column: 1,
              },
            },
            line: 13,
          },
          '2': {
            name: 'mockSetValues',
            decl: {
              start: {
                line: 22,
                column: 9,
              },
              end: {
                line: 22,
                column: 22,
              },
            },
            loc: {
              start: {
                line: 22,
                column: 108,
              },
              end: {
                line: 28,
                column: 1,
              },
            },
            line: 22,
          },
          '3': {
            name: 'mockMapValues',
            decl: {
              start: {
                line: 30,
                column: 9,
              },
              end: {
                line: 30,
                column: 22,
              },
            },
            loc: {
              start: {
                line: 30,
                column: 120,
              },
              end: {
                line: 36,
                column: 1,
              },
            },
            line: 30,
          },
          '4': {
            name: 'mockProperties',
            decl: {
              start: {
                line: 38,
                column: 9,
              },
              end: {
                line: 38,
                column: 23,
              },
            },
            loc: {
              start: {
                line: 38,
                column: 120,
              },
              end: {
                line: 51,
                column: 1,
              },
            },
            line: 38,
          },
          '5': {
            name: '(anonymous_5)',
            decl: {
              start: {
                line: 40,
                column: 43,
              },
              end: {
                line: 40,
                column: 44,
              },
            },
            loc: {
              start: {
                line: 40,
                column: 50,
              },
              end: {
                line: 49,
                column: 3,
              },
            },
            line: 40,
          },
          '6': {
            name: 'mockPrototypeFunctions',
            decl: {
              start: {
                line: 53,
                column: 9,
              },
              end: {
                line: 53,
                column: 31,
              },
            },
            loc: {
              start: {
                line: 53,
                column: 128,
              },
              end: {
                line: 62,
                column: 1,
              },
            },
            line: 53,
          },
          '7': {
            name: 'mockValue',
            decl: {
              start: {
                line: 64,
                column: 9,
              },
              end: {
                line: 64,
                column: 18,
              },
            },
            loc: {
              start: {
                line: 64,
                column: 93,
              },
              end: {
                line: 103,
                column: 1,
              },
            },
            line: 64,
          },
          '8': {
            name: 'handleContainer',
            decl: {
              start: {
                line: 71,
                column: 11,
              },
              end: {
                line: 71,
                column: 26,
              },
            },
            loc: {
              start: {
                line: 71,
                column: 65,
              },
              end: {
                line: 80,
                column: 3,
              },
            },
            line: 71,
          },
          '9': {
            name: '(anonymous_9)',
            decl: {
              start: {
                line: 96,
                column: 52,
              },
              end: {
                line: 96,
                column: 53,
              },
            },
            loc: {
              start: {
                line: 96,
                column: 84,
              },
              end: {
                line: 99,
                column: 5,
              },
            },
            line: 96,
          },
          '10': {
            name: 'replaceFunctions',
            decl: {
              start: {
                line: 105,
                column: 9,
              },
              end: {
                line: 105,
                column: 25,
              },
            },
            loc: {
              start: {
                line: 105,
                column: 76,
              },
              end: {
                line: 107,
                column: 1,
              },
            },
            line: 105,
          },
        },
        branchMap: {
          '0': {
            loc: {
              start: {
                line: 14,
                column: 2,
              },
              end: {
                line: 19,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 14,
                  column: 2,
                },
                end: {
                  line: 19,
                  column: 3,
                },
              },
              {
                start: {
                  line: 14,
                  column: 2,
                },
                end: {
                  line: 19,
                  column: 3,
                },
              },
            ],
            line: 14,
          },
          '1': {
            loc: {
              start: {
                line: 30,
                column: 93,
              },
              end: {
                line: 30,
                column: 118,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 30,
                  column: 109,
                },
                end: {
                  line: 30,
                  column: 118,
                },
              },
            ],
            line: 30,
          },
          '2': {
            loc: {
              start: {
                line: 38,
                column: 93,
              },
              end: {
                line: 38,
                column: 118,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 38,
                  column: 109,
                },
                end: {
                  line: 38,
                  column: 118,
                },
              },
            ],
            line: 38,
          },
          '3': {
            loc: {
              start: {
                line: 42,
                column: 37,
              },
              end: {
                line: 47,
                column: 5,
              },
            },
            type: 'cond-expr',
            locations: [
              {
                start: {
                  line: 42,
                  column: 88,
                },
                end: {
                  line: 45,
                  column: 5,
                },
              },
              {
                start: {
                  line: 45,
                  column: 8,
                },
                end: {
                  line: 47,
                  column: 5,
                },
              },
            ],
            line: 42,
          },
          '4': {
            loc: {
              start: {
                line: 42,
                column: 37,
              },
              end: {
                line: 42,
                column: 85,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 42,
                  column: 37,
                },
                end: {
                  line: 42,
                  column: 59,
                },
              },
              {
                start: {
                  line: 42,
                  column: 63,
                },
                end: {
                  line: 42,
                  column: 85,
                },
              },
            ],
            line: 42,
          },
          '5': {
            loc: {
              start: {
                line: 53,
                column: 101,
              },
              end: {
                line: 53,
                column: 126,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 53,
                  column: 117,
                },
                end: {
                  line: 53,
                  column: 126,
                },
              },
            ],
            line: 53,
          },
          '6': {
            loc: {
              start: {
                line: 57,
                column: 2,
              },
              end: {
                line: 61,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 57,
                  column: 2,
                },
                end: {
                  line: 61,
                  column: 3,
                },
              },
              {
                start: {
                  line: 57,
                  column: 2,
                },
                end: {
                  line: 61,
                  column: 3,
                },
              },
            ],
            line: 57,
          },
          '7': {
            loc: {
              start: {
                line: 67,
                column: 2,
              },
              end: {
                line: 69,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 67,
                  column: 2,
                },
                end: {
                  line: 69,
                  column: 3,
                },
              },
              {
                start: {
                  line: 67,
                  column: 2,
                },
                end: {
                  line: 69,
                  column: 3,
                },
              },
            ],
            line: 67,
          },
          '8': {
            loc: {
              start: {
                line: 73,
                column: 4,
              },
              end: {
                line: 79,
                column: 5,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 73,
                  column: 4,
                },
                end: {
                  line: 79,
                  column: 5,
                },
              },
              {
                start: {
                  line: 73,
                  column: 4,
                },
                end: {
                  line: 79,
                  column: 5,
                },
              },
            ],
            line: 73,
          },
          '9': {
            loc: {
              start: {
                line: 73,
                column: 8,
              },
              end: {
                line: 73,
                column: 44,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 73,
                  column: 8,
                },
                end: {
                  line: 73,
                  column: 17,
                },
              },
              {
                start: {
                  line: 73,
                  column: 21,
                },
                end: {
                  line: 73,
                  column: 44,
                },
              },
            ],
            line: 73,
          },
          '10': {
            loc: {
              start: {
                line: 82,
                column: 2,
              },
              end: {
                line: 102,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 82,
                  column: 2,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
              {
                start: {
                  line: 82,
                  column: 2,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
            ],
            line: 82,
          },
          '11': {
            loc: {
              start: {
                line: 86,
                column: 9,
              },
              end: {
                line: 102,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 86,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
              {
                start: {
                  line: 86,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
            ],
            line: 86,
          },
          '12': {
            loc: {
              start: {
                line: 86,
                column: 13,
              },
              end: {
                line: 86,
                column: 58,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 86,
                  column: 13,
                },
                end: {
                  line: 86,
                  column: 31,
                },
              },
              {
                start: {
                  line: 86,
                  column: 35,
                },
                end: {
                  line: 86,
                  column: 58,
                },
              },
            ],
            line: 86,
          },
          '13': {
            loc: {
              start: {
                line: 88,
                column: 9,
              },
              end: {
                line: 102,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 88,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
              {
                start: {
                  line: 88,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
            ],
            line: 88,
          },
          '14': {
            loc: {
              start: {
                line: 90,
                column: 9,
              },
              end: {
                line: 102,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 90,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
              {
                start: {
                  line: 90,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
            ],
            line: 90,
          },
          '15': {
            loc: {
              start: {
                line: 92,
                column: 9,
              },
              end: {
                line: 102,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 92,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
              {
                start: {
                  line: 92,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
            ],
            line: 92,
          },
          '16': {
            loc: {
              start: {
                line: 92,
                column: 13,
              },
              end: {
                line: 92,
                column: 174,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 92,
                  column: 13,
                },
                end: {
                  line: 92,
                  column: 37,
                },
              },
              {
                start: {
                  line: 92,
                  column: 41,
                },
                end: {
                  line: 92,
                  column: 103,
                },
              },
              {
                start: {
                  line: 92,
                  column: 107,
                },
                end: {
                  line: 92,
                  column: 174,
                },
              },
            ],
            line: 92,
          },
          '17': {
            loc: {
              start: {
                line: 95,
                column: 9,
              },
              end: {
                line: 102,
                column: 3,
              },
            },
            type: 'if',
            locations: [
              {
                start: {
                  line: 95,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
              {
                start: {
                  line: 95,
                  column: 9,
                },
                end: {
                  line: 102,
                  column: 3,
                },
              },
            ],
            line: 95,
          },
          '18': {
            loc: {
              start: {
                line: 95,
                column: 13,
              },
              end: {
                line: 95,
                column: 89,
              },
            },
            type: 'binary-expr',
            locations: [
              {
                start: {
                  line: 95,
                  column: 13,
                },
                end: {
                  line: 95,
                  column: 42,
                },
              },
              {
                start: {
                  line: 95,
                  column: 47,
                },
                end: {
                  line: 95,
                  column: 61,
                },
              },
              {
                start: {
                  line: 95,
                  column: 65,
                },
                end: {
                  line: 95,
                  column: 88,
                },
              },
            ],
            line: 95,
          },
          '19': {
            loc: {
              start: {
                line: 105,
                column: 57,
              },
              end: {
                line: 105,
                column: 74,
              },
            },
            type: 'default/arg',
            locations: [
              {
                start: {
                  line: 105,
                  column: 69,
                },
                end: {
                  line: 105,
                  column: 74,
                },
              },
            ],
            line: 105,
          },
        },
        s: {
          '0': 1,
          '1': 1,
          '2': 1,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
          '11': 0,
          '12': 0,
          '13': 0,
          '14': 0,
          '15': 0,
          '16': 0,
          '17': 0,
          '18': 0,
          '19': 0,
          '20': 0,
          '21': 0,
          '22': 0,
          '23': 0,
          '24': 0,
          '25': 0,
          '26': 0,
          '27': 0,
          '28': 0,
          '29': 0,
          '30': 0,
          '31': 0,
          '32': 0,
          '33': 0,
          '34': 0,
          '35': 0,
          '36': 0,
          '37': 0,
          '38': 0,
          '39': 0,
          '40': 0,
          '41': 0,
          '42': 0,
          '43': 0,
          '44': 0,
          '45': 0,
          '46': 0,
          '47': 0,
          '48': 0,
          '49': 1,
          '50': 1,
        },
        f: {
          '0': 0,
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          '5': 0,
          '6': 0,
          '7': 0,
          '8': 0,
          '9': 0,
          '10': 0,
        },
        b: {
          '0': [0, 0],
          '1': [0],
          '2': [0],
          '3': [0, 0],
          '4': [0, 0],
          '5': [0],
          '6': [0, 0],
          '7': [0, 0],
          '8': [0, 0],
          '9': [0, 0],
          '10': [0, 0],
          '11': [0, 0],
          '12': [0, 0],
          '13': [0, 0],
          '14': [0, 0],
          '15': [0, 0],
          '16': [0, 0, 0],
          '17': [0, 0],
          '18': [0, 0, 0],
          '19': [0],
        },
        inputSourceMap: {
          version: 3,
          sources: ['../src/index.ts'],
          names: [
            'objectWithPrototypeFrom',
            'obj',
            'Object',
            'assign',
            'create',
            'getPrototypeOf',
            'constructBasedOff',
            'constructor',
            'mockSetValues',
            'actualSet',
            'mockedSet',
            'createReplacementValue',
            'recursive',
            'mockValueFn',
            'ogToMockedMap',
            'value',
            'add',
            'mockMapValues',
            'actualMap',
            'mockedMap',
            'Map',
            'key',
            'entries',
            'set',
            'mockProperties',
            'mockedObject',
            'propertyDescriptors',
            'getOwnPropertyDescriptors',
            'keys',
            'forEach',
            'propertyDescriptor',
            'mockedPropertyDescriptor',
            'get',
            'defineProperty',
            'mockPrototypeFunctions',
            'prototype',
            'mockValue',
            'realValue',
            'classInstances',
            'has',
            'handleContainer',
            'createMockStubCallback',
            'mockCallback',
            'size',
            'mocked',
            'mockedFn',
            'undefined',
            'Set',
            'Array',
            'isArray',
            'exports',
            'realVal',
            'opts',
            'map',
            'mocked2',
            'replaceFunctions',
          ],
          mappings:
            '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',
          sourcesContent: [
            "export interface RecursionOptionsObject {\r\n  // Mock the methods of class instances too?\r\n  classInstances?: boolean;\r\n}\r\n\r\nexport type RecursionOptions = RecursionOptionsObject | boolean;\r\n\r\nexport type CreateReplacementValueFn<T> = (originalValue: Function) => T;\r\n\r\nexport type Replaced<T, R> = {\r\n  [P in keyof T]: P extends Function ? R : T[P]\r\n};\r\n\r\nfunction objectWithPrototypeFrom(obj) {\r\n  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);\r\n}\r\n\r\nfunction constructBasedOff(obj) {\r\n  if (obj.constructor) {\r\n    return new obj.constructor();\r\n  } else {\r\n    // We can fallback to just cloning the prototype across if there's no constructor\r\n    return objectWithPrototypeFrom(obj);\r\n  }\r\n}\r\n\r\nfunction mockSetValues<T, R>(\r\n  actualSet: Set<T>,\r\n  mockedSet,\r\n  createReplacementValue: CreateReplacementValueFn<R>,\r\n  recursive: RecursionOptions,\r\n  mockValueFn: MockValueFn,\r\n  ogToMockedMap: Map<any, any>,\r\n): Set<T | Replaced<T, R>> {\r\n  for (const value of actualSet) {\r\n    mockedSet.add(\r\n      mockValueFn(value, createReplacementValue, recursive, mockValueFn, ogToMockedMap),\r\n    );\r\n  }\r\n  return mockedSet;\r\n}\r\n\r\nfunction mockMapValues<T, V, R>(\r\n  actualMap: Map<T, V>,\r\n  mockedMap,\r\n  createReplacementValue: CreateReplacementValueFn<R>,\r\n  recursive: RecursionOptions,\r\n  mockValueFn: MockValueFn,\r\n  ogToMockedMap: Map<any, any> = new Map(),\r\n): Map<T, V | Replaced<V, R>> {\r\n  for (const [key, value] of actualMap.entries()) {\r\n    mockedMap.set(\r\n      key,\r\n      mockValueFn(value, createReplacementValue, recursive, mockValueFn, ogToMockedMap),\r\n    );\r\n  }\r\n  return mockedMap;\r\n}\r\n\r\nfunction mockProperties<T, V, R>(\r\n  value: T,\r\n  mockedObject: V,\r\n  createReplacementValue: CreateReplacementValueFn<R>,\r\n  recursive: RecursionOptions,\r\n  mockValueFn: MockValueFn,\r\n  ogToMockedMap: Map<any, any> = new Map(),\r\n): Replaced<T, R> & V {\r\n  const propertyDescriptors = Object.getOwnPropertyDescriptors(value);\r\n  Object.keys(propertyDescriptors).forEach(key => {\r\n    const propertyDescriptor = propertyDescriptors[key];\r\n    const mockedPropertyDescriptor =\r\n      propertyDescriptor.get || propertyDescriptor.set\r\n        ? {\r\n            ...propertyDescriptor,\r\n            get: mockValueFn(\r\n              propertyDescriptor.get,\r\n              createReplacementValue,\r\n              recursive,\r\n              mockValueFn,\r\n              ogToMockedMap,\r\n            ),\r\n            set: mockValueFn(\r\n              propertyDescriptor.set,\r\n              createReplacementValue,\r\n              recursive,\r\n              mockValueFn,\r\n              ogToMockedMap,\r\n            ),\r\n          }\r\n        : {\r\n            ...propertyDescriptor,\r\n            value: mockValueFn(\r\n              propertyDescriptor.value,\r\n              createReplacementValue,\r\n              recursive,\r\n              mockValueFn,\r\n              ogToMockedMap,\r\n            ),\r\n          };\r\n    Object.defineProperty(mockedObject, key, mockedPropertyDescriptor);\r\n  });\r\n  return mockedObject as Replaced<T, R> & V;\r\n}\r\n\r\nfunction mockPrototypeFunctions<T, V, R>(\r\n  value: T,\r\n  mockedObject: V,\r\n  createReplacementValue: CreateReplacementValueFn<R>,\r\n  recursive: RecursionOptions,\r\n  mockValueFn: MockValueFn,\r\n  ogToMockedMap: Map<any, any> = new Map(),\r\n): Replaced<T, R> & V | V {\r\n  // This will map the prototype values to the mocked object and not other objects with the same prototype\r\n  const prototype = Object.getPrototypeOf(value);\r\n  if (prototype) {\r\n    return mockProperties(\r\n      prototype,\r\n      mockedObject,\r\n      createReplacementValue,\r\n      recursive,\r\n      mockValueFn,\r\n      ogToMockedMap,\r\n    );\r\n  } else {\r\n    return mockedObject;\r\n  }\r\n}\r\n\r\nfunction mockValue<R>(\r\n  realValue,\r\n  createReplacementValue: CreateReplacementValueFn<R>,\r\n  recursive: RecursionOptions,\r\n  mockValueFn: MockValueFn,\r\n  ogToMockedMap: Map<any, any>,\r\n) {\r\n  const classInstances: boolean | undefined =\r\n    (recursive as RecursionOptionsObject).classInstances === true;\r\n  if (ogToMockedMap.has(realValue)) {\r\n    return ogToMockedMap.get(realValue);\r\n  }\r\n  function handleContainer(createMockStubCallback, mockCallback) {\r\n    // .size == 0 to see if we haven't done any recursion yet\r\n    if (recursive || ogToMockedMap.size == 0) {\r\n      const mocked = createMockStubCallback(realValue);\r\n      ogToMockedMap.set(realValue, mocked);\r\n      return mockCallback(\r\n        realValue,\r\n        mocked,\r\n        createReplacementValue,\r\n        recursive,\r\n        mockValueFn,\r\n        ogToMockedMap,\r\n      );\r\n    } else {\r\n      return realValue;\r\n    }\r\n  }\r\n\r\n  if (typeof realValue === 'function') {\r\n    const mockedFn = createReplacementValue(realValue);\r\n    ogToMockedMap.set(realValue, mockedFn);\r\n    return mockedFn;\r\n  } else if (realValue === null || realValue === undefined) {\r\n    return realValue;\r\n  } else if (realValue instanceof Map) {\r\n    return handleContainer(constructBasedOff, mockMapValues);\r\n  } else if (realValue instanceof Set) {\r\n    return handleContainer(constructBasedOff, mockSetValues);\r\n  } else if (\r\n    Array.isArray(realValue) ||\r\n    Object.getPrototypeOf({}) === Object.getPrototypeOf(realValue) ||\r\n    Object.getPrototypeOf(exports) === Object.getPrototypeOf(realValue)\r\n  ) {\r\n    // Mock fields in {...}\r\n    return handleContainer(constructBasedOff, mockProperties);\r\n  } else if (\r\n    typeof realValue === 'object' &&\r\n    (classInstances || ogToMockedMap.size == 0)\r\n  ) {\r\n    return handleContainer(objectWithPrototypeFrom, (realVal, mocked, opts, map) => {\r\n      const mocked2 = mockPrototypeFunctions(\r\n        realVal,\r\n        mocked,\r\n        createReplacementValue,\r\n        opts,\r\n        mockValueFn,\r\n        map,\r\n      );\r\n      return mockProperties(\r\n        realVal,\r\n        mocked2,\r\n        createReplacementValue,\r\n        opts,\r\n        mockValue,\r\n        map,\r\n      );\r\n    });\r\n  } else {\r\n    return realValue;\r\n  }\r\n}\r\nexport type MockValueFn = typeof mockValue;\r\n\r\nexport function replaceFunctions<T, R>(\r\n  value: T,\r\n  createReplacementValue: CreateReplacementValueFn<R>,\r\n  recursive: RecursionOptions = false,\r\n): Replaced<T, R> {\r\n  return mockValue(value, createReplacementValue, recursive, mockValue, new Map());\r\n}\r\n\r\nexport default replaceFunctions;\r\n",
          ],
          file: 'index.js',
        },
        _coverageSchema: '43e27e138ebf9cfc5966b082cf9a028302ed4184',
        hash: '0281018b7d2c67220fb4494c8f57612f20c028d0',
      },
    },
  ].forEach((coverage, i) => {
    it(`${i}`, () => {
      expect(coverage).toEqual(cloneCoverage(coverage));
    });
  });
  it('is a deep clone', () => {
    const coverageWithBranch = {
      aPath: {
        path: 'aPath',
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: { '0': [0, 0] },
        _coverageSchema: 'schema',
        hash: 'hash',
      },
    };
    const clonedCoverageWithBranch = cloneCoverage(coverageWithBranch);
    coverageWithBranch.aPath.b['0'][0] = 1;
    expect(coverageWithBranch.aPath.b['0']).not.toEqual(
      clonedCoverageWithBranch.aPath.b['0'],
    );
  });
  it('clones undefined as empty coverage', () => {
    expect(cloneCoverage(undefined)).toBe(undefined);
  });
});
