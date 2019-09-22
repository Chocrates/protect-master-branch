const nock = require("nock");

const myProbotApp = require("..");

const {Probot: Probot} = require("probot");

const payload = require("./fixtures/issues.opened");

const issueCreatedBody = {
    body: "Thanks for opening this issue!"
};

nock.disableNetConnect();

describe("My Probot app", () => {
    let probot;
    beforeEach(() => {
        probot = new Probot({});
        const app = probot.load(myProbotApp);
        app.app = (() => "test");
    });
    test("creates a passing check", async () => {
        nock("https://api.github.com").post("/app/installations/2/access_tokens").reply(200, {
            token: "test"
        });
        nock("https://api.github.com").post("/repos/hiimbex/testing-things/issues/1/comments", body => {
            expect(body).toMatchObject(issueCreatedBody);
            return true;
        }).reply(200);
        await probot.receive({
            name: "issues",
            payload: payload
        });
    });
    test("buildIssuePayload adds branch name to template", () => {
        var testBranch = "test";
        debugger;
        console.log(app);
        expect(app.buildIssuePayload(testBranch)).toEqual(expect.stringContaining(testBranch));
    });
});
