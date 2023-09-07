#!/usr/bin/env nu
let rootRepoPath = $env.PWD

def pathRelativeToRoot [] {
  # TODO: This probably isn't perfectly OS agnostic due to the mention of / and \
  $in | path expand | path relative-to $rootRepoPath
}

let workspaces = (yarn workspaces list -R --json | lines | each { from json | update location { pathRelativeToRoot } })

print $workspaces
print "Above is are the workspaces that were found"

print "Installing @yarnpkg/doctor"
yarn add @yarnpkg/doctor

print "Running @yarnpkg/doctor"
let doctorOutput = (yarn run doctor)
print "@yarnpkg/doctor printed out the following:"

print $doctorOutput

let packagesToInstall = (
  $doctorOutput 
    | lines
    | each {
      |doctorLine|
      # Filtering against "➤ YN0000: │ /some/path/to/a/file.ts:6:1: Undeclared dependency on @scope/package"
      let dataStr = ($doctorLine | sd '.*YN0000: │ ([^:]+).* Undeclared dependency on ([^\s]+).*' '$1 $2')
      
      if $dataStr == $doctorLine { continue }

      let data = ($dataStr | split row " ")

      let affectedFilePath = ($data.0 | pathRelativeToRoot)

      let candidateWorkspaces = (
        $workspaces
          | where {
            |workspace|
            $affectedFilePath 
              | str starts-with $workspace.location
          }
          | sort-by location -r
      )

      if ($candidateWorkspaces | length) == 0 {
        print $"\nNo candiate workspace found for file ($data.0)"
        continue
      } else {
        print --no-newline .
      }
 
      $candidateWorkspaces
        | first
        | insert missingPackage $data.1
        | insert exampleUsage $data.0
    }
    | uniq-by name missingPackage
    | each {
      |missingDep|
      print $'($missingDep.missingPackage) will be installed in ($missingDep.name)'

      $missingDep
    }
)

print $packagesToInstall

print 'Above are the packages that will be installed. Are you sure you want to proceed? (Y/n)'
if (input) != "Y" {
  return
}

$workspaces | each {
  |workspace|

  let missingDeps = (
    $packagesToInstall
      | where {
        |package|
        $package.name == $workspace.name
      }
      | get missingPackage
  )

  if ($missingDeps | length) <= 0 { continue }

  do {
    let workspacePath = ([$rootRepoPath, $workspace.location] | path join | path expand)
    print $'Changing directory to ($workspacePath)'
    print $'Running "yarn add ($missingDeps | str join " ")" at ($workspace)'
    cd $workspacePath
    yarn add ($missingDeps)
  }
}
