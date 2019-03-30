/**
 * searching/longest-common-subsequence.js
 *
 * MIT License
 *
 * Copyright (c) 2018 Minko Gechev
 */
/**
 * Find the lengths of longest common sub-sequences
 * of two strings and their substrings.
 *
 * Complexity: O(MN).
 *
 * @private
 * @param {String} first string
 * @param {String} second string
 * @return {Array} two dimensional array with LCS
 * lengths of input strings and their substrings.
 *
 */
function getLcsLengths(str1, str2) {
    const result = [];
    for (let i = -1; i < str1.length; i += 1) {
        result[i] = [];
        for (let j = -1; j < str2.length; j += 1) {
            if (i === -1 || j === -1) {
                result[i][j] = 0;
            } else if (str1[i] === str2[j]) {
                result[i][j] = result[i - 1][j - 1] + 1;
            } else {
                result[i][j] = Math.max(result[i - 1][j], result[i][j - 1]);
            }
        }
    }
    return result;
}

/**
 * Find longest common sub-sequences of two strings.
 *
 * Complexity: O(M + N).
 *
 * @private
 * @param {String} first string
 * @param {String} second string
 * @return {Array} two dimensional array with LCS
 * lengths of input strings and their substrings
 * returned from 'getLcsLengths' function.
 *
 */
function getLcs(str1, str2, lcsLengthsMatrix) {
    const execute = (i, j) => {
        if (!lcsLengthsMatrix[i][j]) {
            return '';
        }
        if (str1[i] === str2[j]) {
            return execute(i - 1, j - 1) + str1[i];
        }
        if (lcsLengthsMatrix[i][j - 1] > lcsLengthsMatrix[i - 1][j]) {
            return execute(i, j - 1);
        }
        return execute(i - 1, j);
    };
    return execute(str1.length - 1, str2.length - 1);
}

/**
 * Algorithm from dynamic programming. It finds the longest
 * common sub-sequence of two strings. For example for strings 'abcd'
 * and 'axxcda' the longest common sub-sequence is 'acd'.
 *
 * @example
 * var subsequence = require('path-to-algorithms/src/searching/'+
 * 'longest-common-subsequence').longestCommonSubsequence;
 * console.log(subsequence('abcd', 'axxcda'); // 'acd'
 *
 * @public
 * @module searching/longest-common-subsequence
 * @param {String} first input string.
 * @param {String} second input string.
 * @return {Array} Longest common subsequence.
 */
function longestCommonSubsequence(str1: string, str2: string): string {
    const lcsLengthsMatrix = getLcsLengths(str1, str2);
    return getLcs(str1, str2, lcsLengthsMatrix);
}

export function similarity(a: string, b: string) {
    const intersect = (A, B) => {
        const setB = new Set(B);
        return [...new Set(A)].filter(x => setB.has(x));
    };
    const union = (A, B) => [...new Set([...A, ...B])];

    const lcs = longestCommonSubsequence(a, b);
    const group = str => {
        const grouping = [];
        let lastIsCommon = null; // null !== true & null !== false
        const lcsCopy = [...lcs];
        for (const c of str) {
            const isCommon = lcsCopy[0] === c;
            if (isCommon) {
                lcsCopy.shift();
            }
            if (lastIsCommon !== isCommon) {
                grouping.push(c);
            } else {
                grouping[grouping.length - 1] += c;
            }
            lastIsCommon = isCommon;
        }
        return grouping;
    };
    const groupA = group(a);
    const groupB = group(b);
    return Math.max(...intersect(groupA, groupB).map(x => x.length)) - union(groupA, groupB).length;
}
