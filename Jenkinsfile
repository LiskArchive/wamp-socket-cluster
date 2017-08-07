def initBuild() {
	deleteDir()
	checkout scm
}

def buildDependency() {
	try {
		sh '''#!/bin/bash
		npm install
		'''
	} catch (err) {
		currentBuild.result = 'FAILURE'
		error('Stopping build, installation failed')
	}
}

def runTests() {
	try {
		sh '''#!/bin/bash
		npm run eslint
		npm run test
		'''
	} catch (err) {
		currentBuild.result = 'FAILURE'
		error('Stopping build, installation failed')
	}
}
node('wamp-socket-cluster'){
	lock(resource: "wamp-socket-cluster", inversePrecedence: true) {
		stage ('Prepare Workspace') {
			initBuild()
		}

		stage ('Build Dependencies') {
			buildDependency()
		}

		stage ('Execute Tests') {
			runTests()
		}

		stage ('Set milestone') {
			milestone 1
			currentBuild.result = 'SUCCESS'
		}
	}
}
