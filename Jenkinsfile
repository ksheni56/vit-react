pipeline {
  agent {
    dockerfile true
  }
  stages {
    stage('Test') {
      steps {
        /* Verify that we installed javascript files of non-zero length */
        sh 'test -s /usr/share/nginx/html/static/js/*.js'
      }
    }
  }
}
