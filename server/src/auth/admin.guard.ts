import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminGuard extends JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const parentResult = super.canActivate(context);
    const checkAdmin = () => {
      const request = context.switchToHttp().getRequest();
      if (request.user?.role !== 'admin') {
        throw new ForbiddenException('Admin access required');
      }
      return true;
    };

    if (typeof parentResult === 'boolean') {
      if (!parentResult) return false;
      return checkAdmin();
    }
    if (parentResult instanceof Promise) {
      return parentResult.then((result) => {
        if (!result) return false;
        return checkAdmin();
      });
    }
    return checkAdmin();
  }
}
