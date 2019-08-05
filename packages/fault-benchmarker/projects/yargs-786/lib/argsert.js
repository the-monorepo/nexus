const command = require('./command')()

const positionName = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth']

module.exports = function (expected, callerArguments, length) {
  // preface the argument description with "cmd", so
  // that we can run it through yargs' command parser.
  var position = 0
  var parsed = {demanded: [], optional: []}
  if (typeof expected === 'object') {
    length = callerArguments
    callerArguments = expected
  } else {
    parsed = command.parseCommand('cmd ' + expected)
  }
  const args = [].slice.call(callerArguments)

  while (args.length && args[args.length - 1] === undefined) args.pop()
  length = length || args.length

  if (length < parsed.demanded.length) {
    throw Error('Not enough arguments provided. Expected ' + parsed.demanded.length +
      ' but received ' + args.length + '.')
  }

  const totalCommands = parsed.demanded.length + parsed.optional.length
  if (length > totalCommands) {
    throw Error('Too many arguments provided. Expected max ' + totalCommands +
      ' but received ' + length + '.')
  }

  parsed.demanded.forEach(function (demanded) {
    const arg = args.shift()
    const observedType = guessType(arg)
    const matchingTypes = demanded.cmd.filter(function (type) {
      return type === observedType || type === '*'
    })
    if (matchingTypes.length === 0) argumentTypeError(observedType, demanded.cmd, position, false)
    position += 1
  })

  parsed.optional.forEach(function (optional) {
    if (args.length === 0) return
    const arg = args.shift()
    const observedType = guessType(arg)
    const matchingTypes = optional.cmd.filter(function (type) {
      return type === observedType || type === '*'
    })
    if (matchingTypes.length === 0) argumentTypeError(observedType, optional.cmd, position, true)
    position += 1
  })
}

function guessType (arg) {
  if (Array.isArray(arg)) {
    return 'array'
  } else if (arg === null) {
    return 'null'
  }
  return typeof arg
}

function argumentTypeError (observedType, allowedTypes, position, optional) {
  throw Error('Invalid ' + (positionName[position] || 'manyith') + ' argument.' +
    ' Expected ' + allowedTypes.join(' or ') + ' but received ' + observedType + '.')
}
