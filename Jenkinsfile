pipeline {
    agent any

    environment {
        // You need to add a "Username with password" credential in Jenkins called 'dockerhub-creds'
        DOCKERHUB_CREDS = credentials('dockerhub-creds') 
        
        // Configuration
        EC2_USER = "ubuntu"
        // Replace this with your Master Node's Public IP
        EC2_IP = "3.236.28.67" 
        SSH_CRED_ID = "ec2-ssh-key"
        DEPLOY_PATH = "/home/${EC2_USER}/civic-sense"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                echo 'Logging in to Docker Hub...'
                sh "echo ${DOCKERHUB_CREDS_PSW} | docker login -u ${DOCKERHUB_CREDS_USR} --password-stdin"
            }
        }

        stage('Build & Push Docker Images') {
            parallel {
                stage('Backend') {
                    steps {
                        sh "docker build -t abhi754/civicsense-backend:latest ./backend"
                        sh "docker push abhi754/civicsense-backend:latest"
                    }
                }
                stage('Frontend') {
                    steps {
                        // Build & Push Frontend with Vite environment variable
                        sh "docker build --build-arg VITE_API_URL=http://${EC2_IP}:30001 -t abhi754/civicsense-frontend:latest ./my-app"
                        sh "docker push abhi754/civicsense-frontend:latest"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sshagent([SSH_CRED_ID]) {
                    echo "Deploying to Kubernetes Cluster on Master Node (${EC2_IP})..."
                    
                    // 1. Ensure directory exists on the Master Node
                    sh "ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} 'mkdir -p ${DEPLOY_PATH}/k8s'"
                    
                    // 2. Copy the Kubernetes YAML files to the Master Node
                    sh "scp -o StrictHostKeyChecking=no k8s/*.yaml ${EC2_USER}@${EC2_IP}:${DEPLOY_PATH}/k8s/"
                    
                    // 3. Tell Kubernetes to apply the changes and restart the pods to grab the new images
                    sh """
                        ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_IP} '
                            cd ${DEPLOY_PATH}
                            kubectl apply -f k8s/
                            
                            # Force a restart to ensure it pulls the latest image we just pushed
                            kubectl rollout restart deployment civic-frontend -n civic-sense
                            kubectl rollout restart deployment civic-backend -n civic-sense
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Kubernetes Deployment successful! 🎉'
        }
        failure {
            echo 'Deployment failed. Check Jenkins logs.'
        }
    }
}
