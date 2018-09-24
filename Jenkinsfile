pipeline {
  agent {
    docker {
      image 'node:8'
      args '-p 9002:3000'
      args '-u 0:0'
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