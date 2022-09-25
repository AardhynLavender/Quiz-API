import { Code } from "../../types/http";
import { Response } from "..";
import chai from "chai";

export const AssertStandardResponse = (
  { status, body }: Response,
  code = Code.SUCCESS
) => {
  chai.expect(status).to.equal(code);
  chai.expect(body).to.have.property("msg");
};

export const AssertInvalidAuthorizationResponse = ({
  status,
  body,
}: Response) => {
  const { msg, data } = body;
  chai.expect(status).to.equal(Code.UNAUTHORIZED);
  chai.expect(msg).to.equal("Failed to validate authentication");
  chai.expect(data).to.be.undefined;
};
