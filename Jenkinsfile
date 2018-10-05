pipeline {
  environment {
    HOME = "."
    NODE_PATH = "src/"
  }
  agent {
    docker {
      image 'node:8'
      args '-p 9002:3000'
    }
  }
  stages {
    stage('Build') {
      steps {
        sh 'npm install'
        sh 'npm run build'
      }
    }
  }
}