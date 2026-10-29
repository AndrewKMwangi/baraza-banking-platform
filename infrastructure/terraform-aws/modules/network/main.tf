locals {
  subnet_cidrs = concat(
    var.public_subnet_cidrs,
    var.private_app_subnet_cidrs,
    var.private_db_subnet_cidrs
  )

  # Include the VPC first, followed by every subnet CIDR.
  all_cidrs = concat(
    [var.vpc_cidr],
    local.subnet_cidrs
  )

  # Convert each CIDR's first and last IPv4 addresses
  # into integers so we can compare address ranges.
  start_addresses = [
    for cidr in local.all_cidrs :
    sum([
      for i, octet in split(".", cidrhost(cidr, 0)) :
      tonumber(octet) * [16777216, 65536, 256, 1][i]
    ])
  ]

  end_addresses = [
    for cidr in local.all_cidrs :
    sum([
      for i, octet in split(".", cidrhost(cidr, -1)) :
      tonumber(octet) * [16777216, 65536, 256, 1][i]
    ])
  ]

  # The VPC occupies index zero in the address lists.
  vpc_start = local.start_addresses[0]
  vpc_end   = local.end_addresses[0]

  # The remaining entries correspond to the subnets.
  subnet_starts = slice(
    local.start_addresses,
    1,
    length(local.start_addresses)
  )

  subnet_ends = slice(
    local.end_addresses,
    1,
    length(local.end_addresses)
  )

  # Every subnet's complete address range must fit in the VPC.
  subnets_within_vpc = alltrue([
    for i, start in local.subnet_starts :
    start >= local.vpc_start &&
    local.subnet_ends[i] <= local.vpc_end
  ])

  # Compare every pair of subnet ranges.
  # Two ranges overlap unless one ends before the other starts.
  subnets_do_not_overlap = alltrue(flatten([
    for i, start_a in local.subnet_starts : [
      for j, start_b in local.subnet_starts :
      i >= j ? true : (
        local.subnet_ends[i] < start_b ||
        local.subnet_ends[j] < start_a
      )
    ]
  ]))
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  lifecycle {
    precondition {
      condition     = local.subnets_within_vpc
      error_message = "Every subnet CIDR must fit entirely inside the configured VPC CIDR."
    }

    precondition {
      condition     = local.subnets_do_not_overlap
      error_message = "Public, private application, and private database subnet CIDRs must not overlap."
    }
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-${count.index + 1}"
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Tier        = "public"
  }
}

resource "aws_subnet" "private_app" {
  count = length(var.private_app_subnet_cidrs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_app_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-${count.index + 1}"
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Tier        = "private-app"
  }
}

resource "aws_subnet" "private_db" {
  count = length(var.private_db_subnet_cidrs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_db_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-${count.index + 1}"
    Project     = "BarazaBankingPlatform"
    Environment = var.environment
    ManagedBy   = "Terraform"
    Tier        = "private-db"
  }
}
