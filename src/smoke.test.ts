import { LOGGED_IN_USER } from "@/user";

test("alias resolves", () => expect(LOGGED_IN_USER.firstName).toBe("Peter"));
