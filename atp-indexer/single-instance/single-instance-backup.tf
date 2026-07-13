# Automated backup of the single-instance /data volume (Postgres incl. the ponder_sync
# cache). That volume is the box's durable state — staking is live, so unlike a finished
# auction the data keeps changing — and Data Lifecycle Manager takes daily EBS snapshots of
# it, pruning to a retention window. One snapshot captures everything on /data at once.

variable "si_backup_retain_days" {
  description = "Number of daily /data EBS snapshots to retain"
  type        = number
  default     = 7
}

# DLM assumes this role to create/delete the snapshots.
resource "aws_iam_role" "dlm" {
  name = "${local.si_name}-dlm"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "dlm.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
  tags = local.si_tags
}

resource "aws_iam_role_policy_attachment" "dlm" {
  role       = aws_iam_role.dlm.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole"
}

resource "aws_dlm_lifecycle_policy" "data" {
  description        = "${local.si_name} data volume daily snapshots"
  execution_role_arn = aws_iam_role.dlm.arn
  state              = "ENABLED"

  policy_details {
    resource_types = ["VOLUME"]
    # Matches the Backup tag on aws_ebs_volume.data.
    target_tags = {
      Backup = "${local.si_name}-data"
    }

    schedule {
      name = "daily"
      create_rule {
        interval      = 24
        interval_unit = "HOURS"
        times         = ["03:00"]
      }
      retain_rule {
        count = var.si_backup_retain_days
      }
      copy_tags = true
      tags_to_add = {
        SnapshotType = "${local.si_name}-data-daily"
      }
    }
  }

  tags = local.si_tags
}
