pipeline {
  agent {
    docker {
      image 'node:8'
      args '-p 9002:3000'
    }

  }
  stages {
    stage('Build') {
      steps {
        sh 'npm install yarn --user'
        sh 'yarn install'
        sh 'yarn run build'
      }
    }
  }
}