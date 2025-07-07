#!/bin/sh

case "$CI_COMMIT_TAG" in
    *-production)
        /kaniko/executor \
            --context $CI_PROJECT_DIR \
            --dockerfile $DOCKERFILE \
            --destination $CI_REGISTRY_IMAGE/$NAME:latest \
            --destination $CI_REGISTRY_IMAGE/$NAME:$CI_COMMIT_SHORT_SHA \
            --destination $CI_REGISTRY_IMAGE/$NAME:production \
            $@
        ;;
    *)
        /kaniko/executor \
            --context $CI_PROJECT_DIR \
            --dockerfile $DOCKERFILE \
            --destination $CI_REGISTRY_IMAGE/$NAME:latest \
            --destination $CI_REGISTRY_IMAGE/$NAME:$CI_COMMIT_SHORT_SHA \
            $@
        ;;
esac
