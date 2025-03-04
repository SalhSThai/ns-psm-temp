import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExpiredException } from "../exceptions/expired-jwt.exception";
import { PrismaService } from "src/prisma/prisma.service";
import { Admin } from "@prisma/client";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  async validate(payload: any) {
    const exp = new Date(payload.exp * 1000).getTime();
    const iat = new Date(payload.iat * 1000).getTime();
    const today = new Date().getTime();
    const expiration_time = exp - iat;

    if (today - iat > expiration_time) throw new ExpiredException();

    const user: Omit<Admin, "password"> = await this.prisma.admin.findUnique({
      where: { id: payload.id },
    });

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
