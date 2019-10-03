import {isLocationWithinBounds } from '../src/index';
import { ExpressionLocation } from '@fault/istanbul-util';
type StartLine = number;
type StartColumn = number;
type EndColumn = number;
type EndLine = number;

it('isLocationWithinBounds',() => {
    const testInputs: [
        boolean,
        [StartLine, StartColumn, EndLine, EndColumn],
        [StartLine, StartColumn, EndLine, EndColumn]
    ][] = [
        [
            true,
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ],
        [
            true,
            [0, 0, 2, 2],
            [1, 1, 1, 1]
        ],
        [
            true,
            [0, 0, 2, 2],
            [0, 0, 2, 2]
        ],
        [
            true,
            [1, 1, 2, 2],
            [0, 0, 2, 2]
        ],
        [
            true,
            [1, 1, 1, 1],
            [0, 0, 2, 2]
        ],
        [
            true,
            [0, 0, 1, 1],
            [0, 0, 2, 2]
        ],
        [
            false,
            [0, 0, 2, 2],
            [0, 0, 3, 2]
        ],
        [
            false,
            [0, 0, 2, 2],
            [0, 0, 2, 3]
        ]
    ]
    for(const [isWithinBounds, loc1, loc2] of testInputs) {
        const location1: ExpressionLocation = {
            start: {
                line: loc1[0],
                column: loc1[1]
            },
            end: {
                line: loc1[2],
                column: loc1[3]
            }
        }
        const location2: ExpressionLocation = {
            start: {
                line: loc2[0],
                column: loc2[1]
            },
            end: {
                line: loc2[2],
                column: loc2[3]
            }
        }
        expect(isLocationWithinBounds(location1, location2)).to.equal(isWithinBounds);
        expect(isLocationWithinBounds(location2, location1)).to.equal(isWithinBounds);
    }
})