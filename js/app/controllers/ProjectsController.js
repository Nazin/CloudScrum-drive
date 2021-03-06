'use strict';

cloudScrum.controller('ProjectsController', function ProjectsController($scope, $rootScope, $location, Google, Flow) {

    $('.modal-backdrop').remove();

    $scope.newProjectModal = $('#new-project-modal');
    $scope.projectFileId = Flow.getProjectId();
    $scope.projects = [];

    Google.login().then(function() {

        if (typeof Flow.getCompanyId() === 'undefined') {

            Google.findCompaniesFiles().then(function(files) {

                if (files.length === 0) {
                    $rootScope.newCompanyModal.modal('show');
                    $rootScope.loading = false;
                } else {
                    Flow.setCompany(files[0].id, files[0].title.replace('CloudScrum-', ''));
                    findProjects();
                }
            }, function(error) {
                $rootScope.handleError(error);
            });
        } else {
            findProjects();
        }
    });

    $scope.createProject = function() {

        $rootScope.loading = true;
        $scope.newProjectModal.modal('hide');

        Google.createFolder($scope.projectName, Flow.getCompanyId()).then(function(file) {

            $scope.projects.push({id: file.id, name: $scope.projectName});

            Google.createSpreadsheet('backlog', file.id).then(function(file2) {
                Flow.newProject(file.id, $scope.projectName, file2.id, $scope.projects.length === 1).then(function() {
                    $scope.projectName = '';
                    $location.path('/backlog');
                }).finally(function() {
                    $rootScope.loading = false;
                });
            }, function(error) {
                $rootScope.handleError(error);
            });
        }, function(error) {
            $rootScope.handleError(error);
            $rootScope.loading = false;
        });
    };

    $scope.loadProject = function(project) {
        Flow.setProject(project.id);
        $location.path('/backlog');
    };

    var findProjects = function() {
        Google.findProjectsFiles(Flow.getCompanyId()).then(function(files) {
            if (files.length === 0) {
                if (!$rootScope.companyModalVisible) {
                    $scope.newProjectModal.modal('show');
                }
            } else {
                for (var i=0; i<files.length; i++) {
                    $scope.projects.push({id: files[i].id, name: files[i].title});
                }
            }
        }, function(error) {
            $rootScope.handleError(error);
        }).finally(function() {
            $rootScope.loading = false;
        });
    };
});