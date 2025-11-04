pipeline {
  agent any
  stages {
    stage("Sanity") {
      steps {
        sh "docker --version"
        echo "Hello from Jenkins"
      }
    }
  }
}
