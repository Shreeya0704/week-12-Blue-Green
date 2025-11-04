pipeline {
  agent any
  parameters {
    choice(name: "FORCE_TARGET", choices: ["auto","blue","green"], description: "auto = deploy to idle; or force a color")
    booleanParam(name: "ROLLBACK_IF_FAIL", defaultValue: true, description: "If post-flip smoke test fails, revert router")
  }
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
          case "$FORCE_TARGET" in
            blue)  TARGET=blue  ; PORT=3001 ; COLOR=blue  ;;
            green) TARGET=green ; PORT=3002 ; COLOR=green ;;
            *)     if [ "$CURRENT" = "app-blue" ]; then TARGET=green; PORT=3002; COLOR=green;
                   else TARGET=blue; PORT=3001; COLOR=blue; fi ;;
          esac
          echo "CURRENT=${CURRENT:-none}  TARGET=$TARGET  PORT=$PORT"
          docker rm -f app-$TARGET || true
          docker run -d --name app-$TARGET --net jenkins-net -p ${PORT}:3000 -e COLOR=$COLOR ${IMAGE}:latest
        '''
      }
    }

    stage("Health check (target app)") {
      steps {
        sh '''
          set -eux
          CURRENT=$(docker exec router sh -lc 'grep -o "app-[a-z]*" /etc/nginx/conf.d/default.conf 2>/dev/null | head -n1 || true')
          case "$FORCE_TARGET" in
            blue)  TARGET=blue  ;;
            green) TARGET=green ;;
            *)     if [ "$CURRENT" = "app-blue" ]; then TARGET=green; else TARGET=blue; fi ;;
          esac
          docker run --rm --net jenkins-net curlimages/curl:8.8.0 -fsS http://app-${TARGET}:3000/ | head -c 200
        '''
      }
    }

    stage("Flip router to target (with rollback)") {
      steps {
        sh '''
          set -eux
          CURRENT=$(docker exec router sh -lc 'grep -o "app-[a-z]*" /etc/nginx/conf.d/default.conf 2>/dev/null | head -n1 || true')
          PREV=${CURRENT#app-}
          case "$FORCE_TARGET" in
            blue)  TARGET=blue  ;;
            green) TARGET=green ;;
            *)     if [ "$CURRENT" = "app-blue" ]; then TARGET=green; else TARGET=blue; fi ;;
          esac

          # Flip to TARGET
          docker exec router sh -lc "sed -i 's/app-blue/app-${TARGET}/g; s/app-green/app-${TARGET}/g' /etc/nginx/conf.d/default.conf && nginx -s reload"

          # Smoke test via router
          if ! docker run --rm --net jenkins-net curlimages/curl:8.8.0 -fsS http://router/ | grep -q \"Hello from ${TARGET}\"; then
            echo "Smoke test FAILED after flip."
            if [ "$ROLLBACK_IF_FAIL" = "true" ]; then
              echo "Rolling back router to app-${PREV}"
              docker exec router sh -lc "sed -i 's/app-blue/app-${PREV}/g; s/app-green/app-${PREV}/g' /etc/nginx/conf.d/default.conf && nginx -s reload"
            fi
            exit 1
          fi

          echo "Flip OK. Router now on app-${TARGET}"
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
