# Terraform Infrastructure Explanation (`main.tf`)

This document provides a step-by-step breakdown of your `main.tf` file. You can use this as a reference guide for your presentation to explain exactly what your Infrastructure as Code (IaC) is doing.

---

### 0. The Cloud Provider Configuration
```hcl
provider "aws" {
  region = "us-east-1" 
}
```
* **What it does:** Tells Terraform to authenticate with Amazon Web Services (AWS) and specifies that all infrastructure should be built in the `us-east-1` (N. Virginia) region.
* **Why it's necessary:** Terraform is cloud-agnostic (it works with AWS, Google Cloud, Azure, etc.). You must specify the provider and the exact geographical data center where your servers will live.

---

### 1. The Security Group (The Virtual Firewall)
```hcl
resource "aws_security_group" "k8s_sg" { ... }
```
* **What it does:** Creates a firewall rule set for your EC2 servers. It uses `ingress` rules to open specific incoming ports and `egress` rules to allow outgoing internet traffic.
* **Why it's necessary:** By default, AWS blocks all incoming traffic to protect the servers. This block explicitly opens the ports required for the project:
  * **Port 22:** Allows SSH access so you (and Jenkins) can log into the servers.
  * **Port 80:** Standard HTTP traffic.
  * **Port 30080:** Allows the public to access the React Frontend (NodePort).
  * **Port 6443:** Allows the Worker node to communicate with the Master node's Kubernetes API.
  * **Port 8080:** Allows access to the Jenkins Web UI.

---

### 2. The Kubernetes User Data Script
```hcl
locals { k8s_user_data = <<-EOF ... EOF }
```
* **What it does:** This is a reusable Bash script that runs automatically the very first time an EC2 server boots up.
* **Why it's necessary:** Kubernetes requires a highly specific Linux environment to function. This script automates the tedious setup process:
  * **Disables Swap (`swapoff -a`):** Kubernetes strictly refuses to run if swap memory is enabled.
  * **Configures Networking (`modprobe overlay`):** Enables Linux features required for Pods to communicate with each other.
  * **Installs Containerd (`apt-get install containerd.io`):** Installs the container runtime that actually runs the Docker images inside Kubernetes.
  * **Installs K8s Tools:** Installs `kubeadm` (to bootstrap the cluster), `kubelet` (the agent that runs on every node), and `kubectl` (the command-line tool).

---

### 3 & 4. Provisioning the Kubernetes Servers
```hcl
resource "aws_instance" "k8s_master" { ... }
resource "aws_instance" "k8s_worker" { ... }
```
* **What it does:** Tells AWS to create two EC2 virtual machines (one Master, one Worker) using Ubuntu 24.04 (`ami-04b70fa74e45c3917`).
* **Why it's necessary:** These servers form the physical hardware of your Kubernetes cluster.
  * **Instance Type (`t3.small`):** Kubernetes requires at least 2 CPUs to initialize, which `t3.small` provides.
  * **Attachment:** It attaches the Security Group created earlier and injects the `k8s_user_data` script so the servers automatically configure themselves for Kubernetes on boot.

---

### 5. Provisioning the Jenkins Server
```hcl
resource "aws_instance" "jenkins_server" { ... }
```
* **What it does:** Creates a third EC2 server specifically dedicated to running your CI/CD pipeline.
* **Why it's necessary:** This server isolates your automation from your application. 
  * It has its own dedicated startup script (user data) that installs **Java 17** (required by Jenkins), installs **Jenkins**, and installs **Docker** (so Jenkins can build your images before pushing them).
  * It adds the Jenkins user to the Docker group so the pipeline can run Docker commands without needing `sudo`.

---

### 6. Outputs
```hcl
output "master_public_ip" { ... }
```
* **What it does:** After Terraform finishes building everything, it prints the public IP addresses of all three servers to your terminal.
* **Why it's necessary:** AWS assigns random IP addresses when servers are created. These outputs save you from having to log into the AWS console to figure out the IP addresses you need to access Jenkins or SSH into your cluster.
