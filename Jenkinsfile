pipeline {
  agent any
  environment {
    IMAGE = "docker.io/shreezzz/week-12-blue-green"
  }
  stages {
    stage("Checkout") { steps { checkout scm } }

    stage("Build Image") {
      steps { sh "docker build -t ${IMAGE}:${BUILD_NUMBER} -t ${IMAGE}:latest ." }
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

    stage("Deploy to idle (blue/green)") {
      steps {
        sh '''
          set -eux
          CURRENT=$(docker exec router sh -lc 'grep -o "app-[a-z]*" /etc/nginx/conf.d/default.conf 2>/dev/null | head -n1 || true')
          if [ "$CURRENT" = "app-blue" ]; then IDLE=green; PORT=3002; COLOR=green;
          else IDLE=blue; PORT=3001; COLOR=blue; fi
          echo "CURRENT=${CURRENT:-none}  IDLE=$IDLE  PORT=$PORT"
          docker rm -f app-$IDLE || true
          docker run -d --name app-$IDLE --net jenkins-net -p ${PORT}:3000 -e COLOR=$COLOR ${IMAGE}:latest
          echo IDLE=$IDLE > .idle_env
        '''
      }
    }

    stage("Health check") {
      steps {
        sh '''
          set -eux
          . .idle_env
          docker run --rm --net jenkins-net curlimages/curl:8.8.0 -fsS http://app-${IDLE}:3000/ | head -c 200
        '''
      }
    }

    stage("Flip router to idle") {
      steps {
        sh '''
          set -eux
          . .idle_env
          docker exec router sh -lc "sed -i 's/app-blue/app-${IDLE}/g; s/app-green/app-${IDLE}/g' /etc/nginx/conf.d/default.conf && nginx -s reload"
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
