pipeline {
  agent any
  environment {
    DOCKERHUB_USER = "shreezzz"
    IMAGE = "docker.io/${DOCKERHUB_USER}/week-12-blue-green"
  }
  stages {
    stage("Checkout") {
      steps { checkout scm }
    }
    stage("Build Image") {
      steps {
        sh "docker build -t ${IMAGE}:${BUILD_NUMBER} -t ${IMAGE}:latest ."
      }
    }
    stage("Login & Push") {
      steps {
        withCredentials([usernamePassword(credentialsId: "dockerhub-credentials", usernameVariable: "DOCKER_USER", passwordVariable: "DOCKER_PASS")]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push ${IMAGE}:${BUILD_NUMBER}
            docker push ${IMAGE}:latest
            docker logout
          '''
        }
      }
    }
  }
  post {
    always {
      sh "docker image ls ${IMAGE} || true"
    }
  }
}
