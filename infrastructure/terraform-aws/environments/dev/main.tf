
locals {
  project_name = "baraza"

  common_tags = {
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

module "network" {
  source = "../../modules/network"

  project_name             = local.project_name
  environment              = var.environment
  vpc_cidr                 = "10.20.0.0/16"
  availability_zones       = ["af-south-1a", "af-south-1b"]
  public_subnet_cidrs      = ["10.20.1.0/24", "10.20.2.0/24"]
  private_app_subnet_cidrs = ["10.20.11.0/24", "10.20.12.0/24"]
  private_db_subnet_cidrs  = ["10.20.21.0/24", "10.20.22.0/24"]
}

module "eks" {
  source = "../../modules/eks"

  project_name           = local.project_name
  environment            = var.environment
  vpc_id                 = module.network.vpc_id
  private_app_subnet_ids = module.network.private_app_subnet_ids
  kubernetes_version     = var.kubernetes_version

  node_min_size     = 1
  node_desired_size = 2
  node_max_size     = 3
}

module "rds" {
  source = "../../modules/rds"

  project_name                  = local.project_name
  environment                   = var.environment
  vpc_id                        = module.network.vpc_id
  private_db_subnet_ids         = module.network.private_db_subnet_ids
  application_security_group_id = module.eks.worker_security_group_id
  engine_version                = var.postgres_engine_version

  final_snapshot_identifier = "baraza-dev-postgres-final"
}

module "vpc_endpoints" {
  source = "../../modules/vpc-endpoints"

  project_name                = local.project_name
  environment                 = var.environment
  aws_region                  = var.aws_region
  vpc_id                      = module.network.vpc_id
  private_app_subnet_ids      = module.network.private_app_subnet_ids
  private_app_subnet_cidrs    = module.network.private_app_subnet_cidrs
  private_app_route_table_ids = module.network.private_app_route_table_ids
}
