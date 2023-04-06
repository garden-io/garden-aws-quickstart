import { PlatformTeam, TeamProps } from "@aws-quickstart/eks-blueprints";
import { ArnPrincipal } from "aws-cdk-lib/aws-iam";

interface TeamPlatformProps {
  userRoleArn?: string
  users?: ArnPrincipal[]
}
export class TeamPlatform extends PlatformTeam {
  constructor(teamPlatformProps: TeamPlatformProps) {
    if (teamPlatformProps.userRoleArn && teamPlatformProps.users){
      super({
        name: "platform",
        userRoleArn: teamPlatformProps.userRoleArn,
        users: teamPlatformProps.users
      });
    }
    if (!teamPlatformProps.userRoleArn && teamPlatformProps.users){
      super({
        name: "platform",
        users: teamPlatformProps.users
      });
    }
    if (teamPlatformProps.userRoleArn && !teamPlatformProps.users){
      super({
        name: "platform",
        userRoleArn: teamPlatformProps.userRoleArn
      });
    }
  }
}
