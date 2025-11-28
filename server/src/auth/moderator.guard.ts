import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class ModeratorGuard extends JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const parentResult = super.canActivate(context);
    const checkModerator = () => {
      const request = context.switchToHttp().getRequest();
      const role = request.user?.role;
      if (role !== 'moderator' && role !== 'admin') {
        throw new ForbiddenException('Moderator or Admin access required');
      }
      return true;
    };

    if (typeof parentResult === 'boolean') {
      if (!parentResult) return false;
      return checkModerator();
    }
    if (parentResult instanceof Promise) {
      return parentResult.then((result) => {
        if (!result) return false;
        return checkModerator();
      });
    }
    return checkModerator();
  }
}
