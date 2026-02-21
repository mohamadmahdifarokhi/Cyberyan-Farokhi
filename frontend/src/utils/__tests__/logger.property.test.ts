import * as fc from 'fast-check';
import Logger, { LogLevel } from '../logger';

describe('Logger Property-Based Tests', () => {
  describe('Property 1: Timestamp format consistency', () => {
    it('should output valid ISO 8601 timestamps for any log message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
          (message, level) => {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            let capturedOutput = '';

            console.log = (msg: string) => {
              capturedOutput = msg;
            };
            console.warn = (msg: string) => {
              capturedOutput = msg;
            };
            console.error = (msg: string) => {
              capturedOutput = msg;
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel('DEBUG');

              switch (level) {
                case 'DEBUG':
                  testLogger.debug(message);
                  break;
                case 'INFO':
                  testLogger.info(message);
                  break;
                case 'WARN':
                  testLogger.warn(message);
                  break;
                case 'ERROR':
                  testLogger.error(message);
                  break;
              }

              const timestampMatch = capturedOutput.match(/^\[([^\]]+)\]/);

              expect(timestampMatch).not.toBeNull();

              if (timestampMatch) {
                const timestamp = timestampMatch[1];

                const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

                expect(timestamp).toMatch(iso8601Regex);

                const date = new Date(timestamp);

                expect(date.toString()).not.toBe('Invalid Date');
              }
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 2: Log level presence', () => {
    it('should include a valid severity level in any log message', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
          (message, level) => {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            let capturedOutput = '';

            console.log = (msg: string) => {
              capturedOutput = msg;
            };
            console.warn = (msg: string) => {
              capturedOutput = msg;
            };
            console.error = (msg: string) => {
              capturedOutput = msg;
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel('DEBUG');

              switch (level) {
                case 'DEBUG':
                  testLogger.debug(message);
                  break;
                case 'INFO':
                  testLogger.info(message);
                  break;
                case 'WARN':
                  testLogger.warn(message);
                  break;
                case 'ERROR':
                  testLogger.error(message);
                  break;
              }

              const validLevels = ['[DEBUG]', '[INFO]', '[WARN]', '[ERROR]'];
              const hasValidLevel = validLevels.some((lvl) => capturedOutput.includes(lvl));

              expect(hasValidLevel).toBe(true);

              expect(capturedOutput).toContain(`[${level}]`);
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 3: Format consistency', () => {
    it('should maintain consistent format pattern across all log messages', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              message: fc.string({ minLength: 1, maxLength: 100 }),
              level: fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
            }),
            { minLength: 2, maxLength: 10 },
          ),
          (logEntries) => {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            const capturedOutputs: string[] = [];

            console.log = (msg: string) => {
              capturedOutputs.push(msg);
            };
            console.warn = (msg: string) => {
              capturedOutputs.push(msg);
            };
            console.error = (msg: string) => {
              capturedOutputs.push(msg);
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel('DEBUG');
              testLogger.setColorEnabled(false);

              logEntries.forEach(({ message, level }) => {
                switch (level) {
                  case 'DEBUG':
                    testLogger.debug(message);
                    break;
                  case 'INFO':
                    testLogger.info(message);
                    break;
                  case 'WARN':
                    testLogger.warn(message);
                    break;
                  case 'ERROR':
                    testLogger.error(message);
                    break;
                }
              });

              const formatPattern = /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[(DEBUG|INFO|WARN|ERROR)\] .+/;

              capturedOutputs.forEach((output) => {
                expect(output).toMatch(formatPattern);
              });

              const structures = capturedOutputs.map((output) => {
                const parts = output.match(/^(\[[^\]]+\]) (\[[^\]]+\]) (.+)/);

                return parts ? { hasTimestamp: true, hasLevel: true, hasMessage: true } : null;
              });

              structures.forEach((structure) => {
                expect(structure).not.toBeNull();
                expect(structure?.hasTimestamp).toBe(true);
                expect(structure?.hasLevel).toBe(true);
                expect(structure?.hasMessage).toBe(true);
              });
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 4: Error stack traces', () => {
    it('should include ERROR level and stack trace for any error logged', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (errorMessage, logMessage) => {
            const originalError = console.error;
            let capturedOutput = '';

            console.error = (msg: string) => {
              capturedOutput = msg;
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel('DEBUG');
              testLogger.setColorEnabled(false);

              const error = new Error(errorMessage);

              testLogger.error(logMessage, error);

              expect(capturedOutput).toContain('[ERROR]');

              expect(capturedOutput).toContain(logMessage);

              expect(capturedOutput).toContain('Error:');

              expect(capturedOutput).toContain(errorMessage);
            } finally {
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 19: Log level filtering', () => {
    it('should only output messages at or above the configured log level', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
          fc.string({ minLength: 1, maxLength: 100 }),
          (configuredLevel, message) => {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            const capturedOutputs: { level: string; output: string }[] = [];

            console.log = (msg: string) => {
              capturedOutputs.push({ level: 'DEBUG/INFO', output: msg });
            };
            console.warn = (msg: string) => {
              capturedOutputs.push({ level: 'WARN', output: msg });
            };
            console.error = (msg: string) => {
              capturedOutputs.push({ level: 'ERROR', output: msg });
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel(configuredLevel as keyof typeof LogLevel);
              testLogger.setColorEnabled(false);

              capturedOutputs.length = 0;

              testLogger.debug(`DEBUG: ${message}`);
              testLogger.info(`INFO: ${message}`);
              testLogger.warn(`WARN: ${message}`);
              testLogger.error(`ERROR: ${message}`);

              const levelHierarchy: Record<string, number> = {
                DEBUG: 0,
                INFO: 1,
                WARN: 2,
                ERROR: 3,
              };

              const configuredLevelValue = levelHierarchy[configuredLevel];

              capturedOutputs.forEach(({ output }) => {
                const levelMatch = output.match(/\[(DEBUG|INFO|WARN|ERROR)\]/);

                if (levelMatch) {
                  const outputLevel = levelMatch[1];
                  const outputLevelValue = levelHierarchy[outputLevel];

                  expect(outputLevelValue).toBeGreaterThanOrEqual(configuredLevelValue);
                }
              });

              const expectedCounts: Record<string, number> = {
                DEBUG: 4,
                INFO: 3,
                WARN: 2,
                ERROR: 1,
              };

              expect(capturedOutputs.length).toBe(expectedCounts[configuredLevel]);
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 21: Color coding', () => {
    it('should include ANSI color codes when colors are enabled', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
          (message, level) => {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            let capturedOutput = '';

            console.log = (msg: string) => {
              capturedOutput = msg;
            };
            console.warn = (msg: string) => {
              capturedOutput = msg;
            };
            console.error = (msg: string) => {
              capturedOutput = msg;
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel('DEBUG');
              testLogger.setColorEnabled(true);

              switch (level) {
                case 'DEBUG':
                  testLogger.debug(message);
                  break;
                case 'INFO':
                  testLogger.info(message);
                  break;
                case 'WARN':
                  testLogger.warn(message);
                  break;
                case 'ERROR':
                  testLogger.error(message);
                  break;
              }

              const ansiColorPattern = /\x1b\[\d+m/;

              expect(capturedOutput).toMatch(ansiColorPattern);

              expect(capturedOutput).toContain('\x1b[0m');

              const colorCodes: Record<string, string> = {
                DEBUG: '\x1b[36m',
                INFO: '\x1b[32m',
                WARN: '\x1b[33m',
                ERROR: '\x1b[31m',
              };

              expect(capturedOutput).toContain(colorCodes[level]);
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should not include ANSI color codes when colors are disabled', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
          (message, level) => {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            let capturedOutput = '';

            console.log = (msg: string) => {
              capturedOutput = msg;
            };
            console.warn = (msg: string) => {
              capturedOutput = msg;
            };
            console.error = (msg: string) => {
              capturedOutput = msg;
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel('DEBUG');
              testLogger.setColorEnabled(false);

              switch (level) {
                case 'DEBUG':
                  testLogger.debug(message);
                  break;
                case 'INFO':
                  testLogger.info(message);
                  break;
                case 'WARN':
                  testLogger.warn(message);
                  break;
                case 'ERROR':
                  testLogger.error(message);
                  break;
              }

              const ansiColorPattern = /\x1b\[\d+m/;

              expect(capturedOutput).not.toMatch(ansiColorPattern);
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 20: Dynamic log level changes', () => {
    it('should respect new log level after runtime configuration change', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
          fc.constantFrom('DEBUG', 'INFO', 'WARN', 'ERROR'),
          fc.string({ minLength: 1, maxLength: 100 }),
          (initialLevel, newLevel, message) => {
            const originalLog = console.log;
            const originalWarn = console.warn;
            const originalError = console.error;
            const capturedOutputs: string[] = [];

            console.log = (msg: string) => {
              capturedOutputs.push(msg);
            };
            console.warn = (msg: string) => {
              capturedOutputs.push(msg);
            };
            console.error = (msg: string) => {
              capturedOutputs.push(msg);
            };

            try {
              const testLogger = new Logger();

              testLogger.setLevel(initialLevel as keyof typeof LogLevel);
              testLogger.setColorEnabled(false);

              capturedOutputs.length = 0;

              testLogger.debug(`Initial DEBUG: ${message}`);
              testLogger.info(`Initial INFO: ${message}`);
              testLogger.warn(`Initial WARN: ${message}`);
              testLogger.error(`Initial ERROR: ${message}`);

              const _initialOutputCount = capturedOutputs.length;

              testLogger.setLevel(newLevel as keyof typeof LogLevel);

              capturedOutputs.length = 0;

              testLogger.debug(`New DEBUG: ${message}`);
              testLogger.info(`New INFO: ${message}`);
              testLogger.warn(`New WARN: ${message}`);
              testLogger.error(`New ERROR: ${message}`);

              const levelHierarchy: Record<string, number> = {
                DEBUG: 0,
                INFO: 1,
                WARN: 2,
                ERROR: 3,
              };

              const newLevelValue = levelHierarchy[newLevel];

              capturedOutputs.forEach((output) => {
                const levelMatch = output.match(/\[(DEBUG|INFO|WARN|ERROR)\]/);

                if (levelMatch) {
                  const outputLevel = levelMatch[1];
                  const outputLevelValue = levelHierarchy[outputLevel];

                  expect(outputLevelValue).toBeGreaterThanOrEqual(newLevelValue);
                }
              });

              const expectedCounts: Record<string, number> = {
                DEBUG: 4,
                INFO: 3,
                WARN: 2,
                ERROR: 1,
              };

              expect(capturedOutputs.length).toBe(expectedCounts[newLevel]);
            } finally {
              console.log = originalLog;
              console.warn = originalWarn;
              console.error = originalError;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
