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
        sh 'npm install'
        sh 'npm install -g yarn'
        sh 'yarn install'
        sh 'yarn run build'
      }
    }
  }
}