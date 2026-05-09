provider "aws" {
  region = "us-east-1" # Update to your AWS region if different
}

# 1. Security Group for Kubernetes Cluster
resource "aws_security_group" "k8s_sg" {
  name        = "k8s-cluster-sg"
  description = "Allow Kubernetes, HTTP, and SSH inbound traffic"

  # Allow HTTP (Standard)
  ingress {
    description = "Allow HTTP traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  # Allow Kubernetes NodePort (Frontend)
  ingress {
    description = "Allow React App NodePort"
    from_port   = 30080
    to_port     = 30080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  # Allow SSH
  ingress {
    description = "Allow SSH traffic"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  # Allow Kubernetes API server access
  ingress {
    description = "Allow K8s API Server"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow internal traffic between Master and Worker nodes
  ingress {
    description = "Allow all internal cluster traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  # Allow Jenkins UI
  ingress {
    description = "Allow Jenkins Web UI"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow all outbound
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] 
  }
}

# 2. Reusable User Data Script to Install containerd, kubelet, kubeadm, and kubectl
locals {
  k8s_user_data = <<-EOF
    #!/bin/bash
    # Disable Swap (Required by Kubernetes)
    swapoff -a
    sed -i '/ swap / s/^\(.*\)$/#\1/g' /etc/fstab

    # Configure prerequisites for containerd
    cat <<EOT | tee /etc/modules-load.d/k8s.conf
    overlay
    br_netfilter
    EOT
    modprobe overlay
    modprobe br_netfilter

    # Setup required sysctl params for Kubernetes networking
    cat <<EOT | tee /etc/sysctl.d/k8s.conf
    net.bridge.bridge-nf-call-iptables  = 1
    net.bridge.bridge-nf-call-ip6tables = 1
    net.ipv4.ip_forward                 = 1
    EOT
    sysctl --system

    # Install containerd
    apt-get update
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y containerd.io

    # Configure containerd to use systemd cgroup
    containerd config default | tee /etc/containerd/config.toml
    sed -i 's/SystemdCgroup = false/SystemdCgroup = true/g' /etc/containerd/config.toml
    systemctl restart containerd
    systemctl enable containerd

    # Install kubeadm, kubelet and kubectl (v1.30)
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl gpg
    curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.30/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
    echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.30/deb/ /' | tee /etc/apt/sources.list.d/kubernetes.list
    apt-get update
    apt-get install -y kubelet kubeadm kubectl
    apt-mark hold kubelet kubeadm kubectl
  EOF
}

# 3. Provision the K8s Master Node
resource "aws_instance" "k8s_master" {
  ami           = "ami-04b70fa74e45c3917" # Ubuntu 24.04 LTS
  instance_type = "t3.small" # t3.small is free-tier eligible and provides the 2 CPUs needed for Kubeadm
  key_name      = "civicSense"
  
  vpc_security_group_ids = [aws_security_group.k8s_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = local.k8s_user_data

  tags = {
    Name = "CivicSense-K8s-Master"
    Role = "Master"
  }
}

# 4. Provision the K8s Worker Node
resource "aws_instance" "k8s_worker" {
  ami           = "ami-04b70fa74e45c3917" # Ubuntu 24.04 LTS
  instance_type = "t3.small" # t3.small is free-tier eligible
  key_name      = "civicSense"
  
  vpc_security_group_ids = [aws_security_group.k8s_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = local.k8s_user_data

  tags = {
    Name = "CivicSense-K8s-Worker-1"
    Role = "Worker"
  }
}

# 5. Provision the Jenkins Server
resource "aws_instance" "jenkins_server" {
  ami           = "ami-04b70fa74e45c3917" # Ubuntu 24.04 LTS
  instance_type = "t3.micro"              # Free-tier eligible
  key_name      = "civicSense"

  vpc_security_group_ids = [aws_security_group.k8s_sg.id]

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOF
    #!/bin/bash
    set -e

    # Update system
    apt-get update -y
    apt-get upgrade -y

    # Install Java 17 (Required by Jenkins)
    apt-get install -y fontconfig openjdk-17-jre

    # Install Jenkins LTS
    curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
    echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/ | tee /etc/apt/sources.list.d/jenkins.list > /dev/null
    apt-get update -y
    apt-get install -y jenkins
    systemctl enable jenkins
    systemctl start jenkins

    # Install Docker (so Jenkins can build images)
    apt-get install -y ca-certificates curl gnupg
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io
    systemctl enable docker
    systemctl start docker

    # Add jenkins user to docker group so Jenkins can run docker commands without sudo
    usermod -aG docker jenkins
    systemctl restart jenkins
  EOF

  tags = {
    Name = "CivicSense-Jenkins"
    Role = "Jenkins"
  }
}

# 6. Output the IPs
output "master_public_ip" {
  value       = aws_instance.k8s_master.public_ip
  description = "SSH into this IP to run 'kubeadm init' and set up the cluster."
}

output "worker_public_ip" {
  value       = aws_instance.k8s_worker.public_ip
  description = "SSH into this IP and run the 'kubeadm join' command to attach it."
}

output "jenkins_public_ip" {
  value       = aws_instance.jenkins_server.public_ip
  description = "Open http://<this-ip>:8080 in your browser to access Jenkins."
}
