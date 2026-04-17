import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(payload: {
    sub: string;
    role: string;
    sid: string;
  }) {
    return this.jwtService.signAsync(payload);
  }
}
