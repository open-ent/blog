#!/bin/bash

MVN_OPTS="-Duser.home=/var/maven"

# Params
NO_DOCKER=""
for i in "$@"
do
case $i in
  --no-docker*)
  NO_DOCKER="true"
  shift
  ;;
  *)
  ;;
esac
done

case `uname -s` in
  MINGW* | Darwin*)
    USER_UID=1000
    GROUP_UID=1000
    ;;
  *)
    if [ -z ${USER_UID:+x} ]
    then
      USER_UID=`id -u`
      GROUP_GID=`id -g`
    fi
esac

init() {
  me=`id -u`:`id -g`
  echo "DEFAULT_DOCKER_USER=$me" > .env
}

# Nettoyage du dossier `backend`
function clean() {
  echo "Cleaning..."
  if [ "$NO_DOCKER" = "true" ] ; then
    mvn clean
  else
    docker compose run --rm maven mvn $MVN_OPTS clean
  fi
  echo "Clean done!"
}

install () {
  docker compose run --rm maven mvn $MVN_OPTS install -DskipTests
}

test () {
  docker compose run --rm maven mvn $MVN_OPTS test
}

function build() {
  echo "Building..."
  if [ "$NO_DOCKER" = "true" ] ; then
    mvn $MVN_OPTS install -DskipTests
  else
    docker compose run --rm maven mvn $MVN_OPTS install -DskipTests -U
  fi
  echo "Build done!"
}

publish() {
  version=`docker compose run --rm maven mvn $MVN_OPTS help:evaluate -Dexpression=project.version -q -DforceStdout`
  level=`echo $version | cut -d'-' -f3`
  case "$level" in
    *SNAPSHOT) export nexusRepository='snapshots' ;;
    *)         export nexusRepository='releases' ;;
  esac

  docker compose run --rm  maven mvn -DrepositoryId=ode-$nexusRepository -DskipTests --settings /var/maven/.m2/settings.xml deploy
}

for param in "$@"
do
  case $param in
    init)
      init
      ;;
    clean)
      clean
      ;;
    build)
      build
      ;;
    test)
      test
      ;;
    publish)
      publish
      ;;
    *)
      echo "Invalid argument : $param"
  esac
  if [ ! $? -eq 0 ]; then
    exit 1
  fi
done