terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1" # Update to your desired region
}

# Create Security Group for HTTP, HTTPS, and SSH
resource "aws_security_group" "drmp_sg" {
  name        = "drmp-security-group"
  description = "Security group for DRMP application"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Find latest Ubuntu 24.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# Deploy EC2 Instance
resource "aws_instance" "drmp_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.small"
  vpc_security_group_ids = [aws_security_group.drmp_sg.id]
  key_name               = "DRMP-key" # Replace with your key name in AWS

  # Inject the bootstrap script
  user_data = file("${path.module}/bootstrap.sh")

  tags = {
    Name = "UPPCL-DRMP-Server"
  }
}

output "public_ip" {
  description = "Public IP address of the EC2 Instance"
  value       = aws_instance.drmp_server.public_ip
}
