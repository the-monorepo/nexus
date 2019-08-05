/* global describe, it, beforeEach */

var expect = require('chai').expect
var yargs = require('../')

describe('validation tests', function () {
  beforeEach(function () {
    yargs.reset()
  })

  describe('implies', function () {
    it("fails if '_' populated, and implied argument not set", function (done) {
      yargs(['cat'])
        .implies({
          1: 'foo'
        })
        .fail(function (msg) {
          msg.should.match(/Implications failed/)
          return done()
        })
        .argv
    })

    it("fails if key implies values in '_', but '_' is not populated", function (done) {
      yargs(['--foo'])
        .boolean('foo')
        .implies({
          'foo': 1
        })
        .fail(function (msg) {
          msg.should.match(/Implications failed/)
          return done()
        })
        .argv
    })

    it("fails if --no-foo's implied argument is not set", function (done) {
      yargs([])
        .implies({
          '--no-bar': 'foo'
        })
        .fail(function (msg) {
          msg.should.match(/Implications failed/)
          return done()
        })
        .argv
    })

    it('fails if a key is set, along with a key that it implies should not be set', function (done) {
      yargs(['--bar', '--foo'])
        .implies({
          'bar': '--no-foo'
        })
        .fail(function (msg) {
          msg.should.match(/Implications failed/)
          return done()
        })
        .argv
    })

    it('does not treat --no- as a special case if boolean negation is disabled', function (done) {
      yargs(['--foo'], './test/fixtures')
        .implies({
          'foo': '--no-foo'
        })
        .fail(function (msg) {
          msg.should.match(/Implications failed/)
          return done()
        })
        .argv
    })
  })

  describe('demand', function () {
    it('fails with standard error message if msg is not defined', function (done) {
      yargs([])
        .demand(1)
        .fail(function (msg) {
          msg.should.equal('Not enough non-option arguments: got 0, need at least 1')
          return done()
        })
        .argv
    })

    it('fails in strict mode with invalid command', function (done) {
      yargs(['koala'])
        .command('wombat', 'wombat burrows')
        .command('kangaroo', 'kangaroo handlers')
        .demand(1)
        .strict()
        .fail(function (msg) {
          msg.should.equal('Unknown argument: koala')
          return done()
        })
        .argv
    })

    it('does not fail in strict mode when no commands configured', function () {
      var argv = yargs('koala')
        .demand(1)
        .strict()
        .fail(function (msg) {
          expect.fail()
        })
        .argv
      argv._[0].should.equal('koala')
    })

    it('fails when a required argument is missing', function (done) {
      yargs('-w 10 marsupial')
        .demand(1, ['w', 'b'])
        .fail(function (msg) {
          msg.should.equal('Missing required argument: b')
          return done()
        })
        .argv
    })

    it('fails when required arguments are present, but a command is missing', function (done) {
      yargs('-w 10 -m wombat')
        .demand(1, ['w', 'm'])
        .fail(function (msg) {
          msg.should.equal('Not enough non-option arguments: got 0, need at least 1')
          return done()
        })
        .argv
    })

    it('fails without a message if msg is null', function (done) {
      yargs([])
        .demand(1, null)
        .fail(function (msg) {
          expect(msg).to.equal(null)
          return done()
        })
        .argv
    })
  })

  describe('choices', function () {
    it('fails with one invalid value', function (done) {
      yargs(['--state', 'denial'])
        .choices('state', ['happy', 'sad', 'hungry'])
        .fail(function (msg) {
          msg.split('\n').should.deep.equal([
            'Invalid values:',
            '  Argument: state, Given: "denial", Choices: "happy", "sad", "hungry"'
          ])
          return done()
        })
        .argv
    })

    it('fails with one valid and one invalid value', function (done) {
      yargs(['--characters', 'susie', '--characters', 'linus'])
        .choices('characters', ['calvin', 'hobbes', 'susie', 'moe'])
        .fail(function (msg) {
          msg.split('\n').should.deep.equal([
            'Invalid values:',
            '  Argument: characters, Given: "linus", Choices: "calvin", "hobbes", "susie", "moe"'
          ])
          return done()
        })
        .argv
    })

    it('fails with multiple invalid values for same argument', function (done) {
      yargs(['--category', 'comedy', '--category', 'drama'])
        .choices('category', ['animal', 'vegetable', 'mineral'])
        .fail(function (msg) {
          msg.split('\n').should.deep.equal([
            'Invalid values:',
            '  Argument: category, Given: "comedy", "drama", Choices: "animal", "vegetable", "mineral"'
          ])
          return done()
        })
        .argv
    })

    it('fails with case-insensitive value', function (done) {
      yargs(['--env', 'DEV'])
        .choices('env', ['dev', 'prd'])
        .fail(function (msg) {
          msg.split('\n').should.deep.equal([
            'Invalid values:',
            '  Argument: env, Given: "DEV", Choices: "dev", "prd"'
          ])
          return done()
        })
        .argv
    })

    it('fails with multiple invalid arguments', function (done) {
      yargs(['--system', 'osx', '--arch', '64'])
        .choices('system', ['linux', 'mac', 'windows'])
        .choices('arch', ['x86', 'x64', 'arm'])
        .fail(function (msg) {
          msg.split('\n').should.deep.equal([
            'Invalid values:',
            '  Argument: system, Given: "osx", Choices: "linux", "mac", "windows"',
            '  Argument: arch, Given: 64, Choices: "x86", "x64", "arm"'
          ])
          return done()
        })
        .argv
    })
  })

  describe('config', function () {
    it('should raise an appropriate error if JSON file is not found', function (done) {
      yargs(['--settings', 'fake.json', '--foo', 'bar'])
        .alias('z', 'zoom')
        .config('settings')
        .fail(function (msg) {
          msg.should.eql('Invalid JSON config file: fake.json')
          return done()
        })
        .argv
    })

    // see: https://github.com/yargs/yargs/issues/172
    it('should not raise an exception if config file is set as default argument value', function () {
      var fail = false
      yargs([])
        .option('config', {
          default: 'foo.json'
        })
        .config('config')
        .fail(function () {
          fail = true
        })
        .argv

      fail.should.equal(false)
    })

    it('should be displayed in the help message', function () {
      var checkUsage = require('./helpers/utils').checkOutput
      var r = checkUsage(function () {
        return yargs(['--help'])
          .config('settings')
          .help('help')
          .wrap(null)
          .argv
      })
      r.should.have.property('logs').with.length(1)
      r.logs.join('\n').split(/\n+/).should.deep.equal([
        'Options:',
        '  --settings  Path to JSON config file',
        '  --help      Show help  [boolean]',
        ''
      ])
    })

    it('should be displayed in the help message with its default name', function () {
      var checkUsage = require('./helpers/utils').checkOutput
      var r = checkUsage(function () {
        return yargs(['--help'])
            .config()
            .help('help')
            .wrap(null)
            .argv
      })
      r.should.have.property('logs').with.length(1)
      r.logs.join('\n').split(/\n+/).should.deep.equal([
        'Options:',
        '  --config  Path to JSON config file',
        '  --help    Show help  [boolean]',
        ''
      ])
    })

    it('should allow help message to be overridden', function () {
      var checkUsage = require('./helpers/utils').checkOutput
      var r = checkUsage(function () {
        return yargs(['--help'])
          .config('settings', 'pork chop sandwiches')
          .help('help')
          .wrap(null)
          .argv
      })
      r.should.have.property('logs').with.length(1)
      r.logs.join('\n').split(/\n+/).should.deep.equal([
        'Options:',
        '  --settings  pork chop sandwiches',
        '  --help      Show help  [boolean]',
        ''
      ])
    })

    it('outputs an error returned by the parsing function', function () {
      var checkUsage = require('./helpers/utils').checkOutput
      var r = checkUsage(function () {
        return yargs(['--settings=./package.json'])
          .config('settings', 'path to config file', function (configPath) {
            return Error('someone set us up the bomb')
          })
          .help('help')
          .wrap(null)
          .argv
      })

      r.errors.join('\n').split(/\n+/).should.deep.equal([
        'Options:',
        '  --settings  path to config file',
        '  --help      Show help  [boolean]',
        'someone set us up the bomb'
      ])
    })

    it('outputs an error if thrown by the parsing function', function () {
      var checkUsage = require('./helpers/utils').checkOutput
      var r = checkUsage(function () {
        return yargs(['--settings=./package.json'])
          .config('settings', 'path to config file', function (configPath) {
            throw Error('someone set us up the bomb')
          })
          .help('help')
          .wrap(null)
          .argv
      })

      r.errors.join('\n').split(/\n+/).should.deep.equal([
        'Options:',
        '  --settings  path to config file',
        '  --help      Show help  [boolean]',
        'someone set us up the bomb'
      ])
    })
  })

  describe('defaults', function () {
    // See https://github.com/chevex/yargs/issues/31
    it('should not fail when demanded options with defaults are missing', function () {
      yargs()
        .fail(function (msg) {
          throw new Error(msg)
        })
        .option('some-option', {
          describe: 'some option',
          demand: true,
          default: 88
        })
        .strict()
        .parse([])
    })
  })

  describe('strict mode', function () {
    it('does not fail when command with subcommands called', function () {
      yargs('one')
        .command('one', 'level one', function (yargs) {
          return yargs
            .command('twoA', 'level two A')
            .command('twoB', 'level two B')
            .strict()
            .fail(function (msg) {
              expect.fail()
            })
        }, function (argv) {
          argv._[0].should.equal('one')
        })
        .argv
    })
  })
})
