pipeline {
  environment {
    HOME = "."
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
        sh 'npm install git+https://git@github.com/ViceIndustryToken/steem-js.git#vit-release-0.7.1'
        sh 'npm run build'
      }
    }
  }
}