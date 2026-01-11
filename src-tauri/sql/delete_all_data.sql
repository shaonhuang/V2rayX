-- ⚠️ WARNING: DANGEROUS OPERATION ⚠️

-- Disable foreign key constraints temporarily for more efficient deletion
PRAGMA foreign_keys = OFF;

-- Delete data from tables with foreign keys first
-- Child tables (with foreign keys)

-- ⚠️ The following statements will DELETE ALL ROWS from each table ⚠️
-- To delete specific rows, add a WHERE clause to each statement
-- For example: DELETE FROM Subscriptions WHERE UserID = 'specific_user_id';

-- Delete from Subscriptions table
DELETE FROM Subscriptions;

-- Delete from VmessUsers table
DELETE FROM VmessUsers;

-- Delete from VmessVnext table
DELETE FROM VmessVnext;

-- Delete from WsSettings table
DELETE FROM WsSettings;

-- Delete from TlsSettings table
DELETE FROM TlsSettings;

-- Delete from TrojanServers table
DELETE FROM TrojanServers;

-- Delete from TcpSettings table
DELETE FROM TcpSettings;

-- Delete from StreamSettings table
DELETE FROM StreamSettings;

-- Delete from Shadowsocks table
DELETE FROM Shadowsocks;

-- Delete from QuicSettings table
DELETE FROM QuicSettings;

-- Delete from Outbounds table
DELETE FROM Outbounds;

-- Delete from KcpSettings table
DELETE FROM KcpSettings;

-- Delete from Hysteria2Settings table
DELETE FROM Hysteria2Settings;

-- Delete from Hysteria2 table
DELETE FROM Hysteria2;

-- Delete from Http/2Settings table
DELETE FROM "Http/2Settings";

-- Delete from GrpcSettings table
DELETE FROM GrpcSettings;

-- Delete from Endpoints table
DELETE FROM Endpoints;

-- Delete from Stats table
DELETE FROM Stats;

-- Delete from Policy table
DELETE FROM Policy;

-- Delete from Log table
DELETE FROM Log;

-- Delete from Inbounds table
DELETE FROM Inbounds;

-- Delete from EndpointsGroups table
DELETE FROM EndpointsGroups;

-- Delete from DNS table
DELETE FROM DNS;

-- Delete from AppStatus table
DELETE FROM AppStatus;

-- Delete from Api table
DELETE FROM Api;

-- Delete from AppSettings table
DELETE FROM AppSettings;

-- Finally delete from User table
DELETE FROM User;

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Commit the transaction
COMMIT;

-- Optionally, reclaim freed space
VACUUM;

-- Print confirmation message
SELECT 'All data has been deleted from all tables.' as message;

-- Add a safety template for selective deletion
/*
-- SAFER ALTERNATIVE: Delete only specific data
BEGIN TRANSACTION;

-- Example of targeted deletion (replace with your specific criteria)
DELETE FROM Subscriptions WHERE UserID = 'specific_user_id';
DELETE FROM Endpoints WHERE GroupID = 'specific_group_id';
-- Add more targeted deletions as needed

COMMIT;
*/
