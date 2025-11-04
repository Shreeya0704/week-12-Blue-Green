pipeline {
  agent any
  environment {
    DOCKERHUB_USER = "shreezzz"
    IMAGE = "docker.io//week-12-blue-green"
  }
  stages {
    stage("Checkout") { steps { checkout scm } }

    stage("Build Image") {
      steps { sh "docker build -t : -t :latest ." }
    }

    stage("Login & Push") {
      steps {
        withCredentials([usernamePassword(credentialsId: "dockerhub-credentials", usernameVariable: "DOCKER_USER", passwordVariable: "DOCKER_PASS")]) {
          sh '''
            echo "" | docker login -u "" --password-stdin
            docker push :
            docker push :latest
            docker logout
          '''
        }
      }
    }

    stage("Deploy to idle (blue/green)") {
      steps {
        sh '''
          set -eux
          CURRENT=app-green
          if [ "" = "app-blue" ]; then IDLE=green; PORT=3002; COLOR=green;
          else IDLE=blue; PORT=3001; COLOR=blue; fi
          echo "CURRENT=  IDLE=  PORT="
          docker rm -f app- || true
          docker run -d --name app- --net jenkins-net -p :3000 -e COLOR= :latest
          echo IDLE= > .idle_env
        '''
      }
    }

    stage("Health check") {
      steps {
        sh '''
          set -eux
          . .idle_env
          docker run --rm --net jenkins-net curlimages/curl:8.8.0 -fsS http://app-:3000/ | head -c 200
        '''
      }
    }

    stage("Flip router to idle") {
      steps {
        sh '''
          set -eux
          . .idle_env
          docker exec router sh -lc "sed -i 's/app-blue/app-/g; s/app-green/app-/g' /etc/nginx/conf.d/default.conf && nginx -s reload"
        '''
      }
    }
  }
  post {
    always {
      sh "docker ps --format 'table {{.Names}}\\t{{.Image}}\\t{{.Ports}}' | sed -n '1,200p'"
    }
  }
}
