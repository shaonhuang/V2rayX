CREATE TABLE Subscriptions (
    UserID         TEXT NOT NULL,
    Remark         TEXT NOT NULL,
    Url            TEXT NOT NULL,
    SubscriptionID TEXT NOT NULL,
    GroupID        TEXT NOT NULL
);

ALTER TABLE "User"
    ADD Salt TEXT NOT NULL DEFAULT '';
