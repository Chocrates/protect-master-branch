const nock = require("nock");

const myProbotApp = require("..");

const {Probot: Probot} = require("probot");

const issuesOpenedPayload = require("./fixtures/issues.opened");

const listBranchesPayload = require("./fixtures/list.branches");

const defaultBranchEditedPayload = require("./fixtures/repository.edited.default_branch");

const GitHub = require("probot/lib/github");

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
    test("RepositoryEdited recieves correctly", async () => {
        const owner = "ChocratesTestOrg";
        const repo = "TestRepo";
        const branch = "Chocrates-patch-1";
        const previousBranch = 'master'
        nock('https://api.github.com')
              .post('/app/installations/2056458/access_tokens')
              .reply(200, { token: 'test' })

        nock("https://api.github.com")
            .put(`/repos/${owner}/${repo}/branches/${branch}/protection`)
            .reply("200");

        nock("https://api.github.com")
            .delete(`/repos/${owner}/${repo}/branches/${previousBranch}/protection`)
            .reply("204");

        nock("https://api.github.com")
            .post(`/repos/${owner}/${repo}/issues`)
            .reply("200");

        await probot.receive({
            name: "repository.edited",
            payload: defaultBranchEditedPayload
        });
    });

    test("buildIssuePayload adds branch name to template", () => {
        var testBranch = "test";
        expect(app.buildIssuePayload(testBranch)).toEqual(expect.stringContaining(testBranch));
    });

    test("listBranches branches from payload", async () => {
        const owner = "testOwner";
        const repo = "testRepo";
        nock("https://api.github.com").post("/app/installations/2/access_tokens").reply(200, {
            token: "test"
        });
        nock("https://api.github.com")
            .get(`/repos/${owner}/${repo}/branches`).reply("200", listBranchesPayload);
        const context = {
            github: new GitHub.GitHubAPI()
        };
        var branches = await app.listBranches(context, owner, repo);
        var expectedBranches = [ 
            {
                name: "master",
                commit: {
                    sha: "c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc",
                    url: "https://api.github.com/repos/octocat/Hello-World/commits/c5b97d5ae6c19d5c5df71a34c7fbeeda2479ccbc"
                },
                protected: true,
                protection: {
                    enabled: true,
                    required_status_checks: { 
                        enforcement_level: "non_admins",
                        contexts: [
                            "ci-test",
                            "linter"
                        ]
                    }
                },
                protection_url: "https://api.github.com/repos/octocat/hello-world/branches/master/protection"
            } 
        ];
        expect(branches).toMatchObject(expectedBranches);
    });
    
    test("notifyOwner makes an issue request with proper payload", async () =>  {
        const owner = "testOwner";
        const repo = "testRepo";
        const user = "testUser";
        const branch = "master";
        nock("https://api.github.com")
            .post(`/repos/${owner}/${repo}/issues`, body => {
                expect(body.title).toEqual(expect.stringContaining(`@${user}`))
                expect(body.body).toEqual(expect.stringContaining(`${branch}`))
                return true;
            })
            .reply("200");

        const context = {
            github: new GitHub.GitHubAPI()
        };
        await app.notifyOwner(context, owner, repo, user, branch);
    });

    test("removeBranchProtection makes a request with proper branch", async () =>  {
        const owner = "testOwner";
        const repo = "testRepo";
        const branch = "master";
        nock("https://api.github.com")
            .delete(`/repos/${owner}/${repo}/branches/${branch}/protection`)
            .reply("204");

        const context = {
            github: new GitHub.GitHubAPI()
        };

        //Nock will fail the test for us if the API call isn't made
        await app.removeBranchProtection(context, owner, repo, branch);
    });


    test("updateDefaultBranchProtection makes a branch protection call with the right branch ", async () =>  {
        const owner = "testOwner";
        const repo = "testRepo";
        const branch = "master";
        nock("https://api.github.com")
            .put(`/repos/${owner}/${repo}/branches/${branch}/protection`, body => {
                expect(body.enforce_admins).toBe(true)
                expect(body.required_pull_request_reviews.require_code_owner_review).toBe(true)
                expect(body.required_pull_request_reviews.dismiss_stale_review).toBe(true)
                expect(body.restrictions).toMatchObject({teams:[],users:[]})
                
                return true;
            })
            .reply("200");

        const context = {
            github: new GitHub.GitHubAPI()
        };
        await app.updateDefaultBranchProtection(context, owner, repo, branch);
    });

    test("defaultBranchExists checks list for default branch", () => {
        const branches = [ {
            name: "master"
        } ];
        expect(app.defaultBranchExists(branches, "master")).toBe(true);
    });

    test("defaultBranchExists checks empty list for default branch", () => {
        const branches = [];
        expect(app.defaultBranchExists(branches, "master")).toBe(false);
    });

    test("defaultBranchExists checks list for missing branch", () => {
        const branches = [ {
            name: "master"
        } ];
        expect(app.defaultBranchExists(branches, "anythingElse")).toBe(false);
    });

    test("getInfoFromContext parses info from payload", () => {
        var context = {
            payload: {
                sender: {
                    login: "user"
                },
                repository: {
                    name: "repo",
                    owner: {
                        login: "owner"
                    },
                    default_branch: "master"
                },
                ref: "heads/master"
            }
        };
        var {user: user, repo: repo, owner: owner, defaultBranch: defaultBranch, branch: branch} = app.getInfoFromContext(context);
        expect([ user, repo, owner, defaultBranch, branch ]).toMatchObject([ "user", "repo", "owner", "master", "heads/master" ]);
    });

        
    test("getChangedBranch returns the changed branch", () => {
        const context = {
            payload: {
                changes: {
                    default_branch: {
                        from: 'master'
                    }
                }
            }
        } 
        expect(app.getChangedBranch(context)).toBe('master');
    });
    
    test("buildIssueTitle returns String with User Name notified", () => {
        const user = 'user'
        expect(app.buildIssueTitle(user)).toEqual(expect.stringContaining(`@${user}`))
    });

    test("buildIssuePayload returns String with branch name ", () => {
        const branch = 'master'
        expect(app.buildIssuePayload(branch)).toEqual(expect.stringContaining(branch))
    });

});
